import { delegate, type DelegateType } from "@shinka-rpc/util";

import { Hub, type HubOptions, type HubConnectProps } from "./hub";

import {
  defaultRequestTimeout,
  defaultSerializerRoot,
  defaultExclusiveLock,
} from "./defaults";
import { setupHandlerRegistries } from "./shinka";
import type { Bus } from "./bus";

import type {
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  ManageEventListener,
  SerializerRoot,
  InternalHandlerThisArg,
  TransportServer,
  TransportFactory,
  TransportConnectFn,
  ShinkaOn,
  ServerEventType,
  ManageEventListenerPair,
  TransportRF,
  SerializerRF,
  InternalHandlerRegistries,
  IBus,
  CompleteFn,
} from "./types";

import { baseListenerFactory } from "./factory/base-listener-factory";
import { createEventListenerPair } from "./factory/event-listener-pair";

const serverEventTypes: ServerEventType[] = [
  "connect",
  "predisconnect",
  "postdisconnect",
];

const createServerEventListeners = baseListenerFactory(
  serverEventTypes,
  Set<() => void>,
);

const connectFn = <SO, TO, TC>(
  connect: (props: HubConnectProps<SO, TO, TC>) => Promise<Bus<SO, TO, TC>>,
  transportHandlers: InternalHandlerRegistries<SO, TO, any>,
  serializer: SerializerRF<SO, TO, any>,
  complete: CompleteFn<SO, TO, TC> | undefined,
  transportFactory: TransportFactory<SO, TO, any, TC>,
) => {
  const transport: TransportRF<SO, TO, any, TC> = [
    transportHandlers,
    transportFactory,
  ];
  const props: HubConnectProps<SO, TO, TC> = {
    transport,
    serializer,
    complete,
  };
  connect(props);
};

const transportHelper = <SO, TO, TC>(
  transportServer: TransportServer<SO, TO, any, TC>,
  connect: TransportConnectFn<SO, TO, any, TC>,
  listeners: ManageEventListenerPair<ServerEventType>,
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, any>>,
) => transportServer(shinkaOn, connect, listeners);

const connectDefault = () => {
  throw new Error("Server is not started!");
};

const enum ServerState {
  STOPPED = 0,
  STARTED = 1,
  STOPPING = 2,
}

type ServerVars = {
  state: ServerState;
};

export type ServerOptions<SO, TO, TC> = HubOptions<SO, TO> & {
  transport: TransportServer<SO, TO, any, TC>;
  serializer?: SerializerRoot<SO, TO, any>;
  complete?: CompleteFn<SO, TO, TC>;
};

export class Server<SO, TO, TC> {
  #hub!: Hub<SO, TO, TC>;
  #connectDelegate!: DelegateType<TransportConnectFn<SO, TO, any, TC>>;
  #vars!: ServerVars;
  #connectFn!: TransportConnectFn<SO, TO, any, TC>;
  #callEvent!: (type: ServerEventType, ...args: any) => void;

  public onRequest!: ShinkaOnRequest<SO, TO, IBus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<IBus<SO, TO>>;
  public addEventListener!: ManageEventListener<IBus<SO, TO>>;
  public removeEventListener!: ManageEventListener<IBus<SO, TO>>;

  public extra!: Record<string | symbol, any>;

  constructor({
    outscope,
    transport: transportServerFactory,
    serializer: serializerRoot = defaultSerializerRoot,
    limon = null,
    responseTimeout,
    lock = defaultExclusiveLock,
    complete,
  }: ServerOptions<SO, TO, TC>) {
    this.#hub = new Hub({ outscope, responseTimeout, limon, lock });
    this.#vars = { state: ServerState.STOPPED };
    const { 0: listeners, 1: callEvent } = createEventListenerPair(
      createServerEventListeners,
    );
    this.#callEvent = callEvent;
    this.#connectDelegate = delegate(
      connectDefault as TransportConnectFn<SO, TO, any, TC>,
    );
    const { 0: transportRegistries } = setupHandlerRegistries(
      (transportHelper<SO, TO, TC>).bind(
        0,
        transportServerFactory,
        this.#connectDelegate.call,
        listeners,
      ),
    );

    const serializerRF = setupHandlerRegistries(serializerRoot);

    this.#connectFn = (connectFn<SO, TO, TC>).bind(
      0,
      this.#hub.connect,
      transportRegistries,
      serializerRF,
      complete,
    );

    this.onDataEvent = this.#hub.onDataEvent;
    this.onRequest = this.#hub.onRequest;
    this.addEventListener = this.#hub.addEventListener;
    this.removeEventListener = this.#hub.removeEventListener;
    this.extra = this.#hub.extra;

    Object.freeze(this);
  }

  start = () => {
    if (this.#vars.state !== ServerState.STOPPED)
      return console.error("Server is not in `STOPPED` state");
    this.#connectDelegate.set(this.#connectFn);
    this.#callEvent("connect");
    this.#vars.state = ServerState.STARTED;
  };

  stop = async () => {
    if (this.#vars.state !== ServerState.STARTED)
      return console.error("Server is not in `STARTED` state");
    this.#vars.state = ServerState.STOPPING;
    this.#callEvent("predisconnect");
    this.#connectDelegate.reset();
    try {
      await this.#hub.dispose();
    } catch (e) {
      console.trace(e);
    }
    this.#callEvent("postdisconnect");
    this.#vars.state = ServerState.STOPPED;
  };

  public get size() {
    return this.#hub.size;
  }
}
