import { delegate, type DelegateType } from "@shinka-rpc/util";

import { Hub, type HubOptions, type HubConnectProps } from "./hub";

import { defaultRequestTimeout, defaultSerializerRoot } from "./defaults";
import { setupHandlerRegistries } from "./shinka";
import type { Bus } from "./bus";

import type {
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  ManageEventListener,
  SerializerRoot,
  InternalHandlerThisArg,
  // SerializerFactory,
  TransportServer,
  TransportFactory,
  TransportConnectFn,
  ShinkaOn,
  ServerEventType,
  ManageEventListenerPair,
  TransportRF,
  SerializerRF,
  // LiMonRF,
  InternalHandlerRegistries,
} from "./types";

import { baseListenerFactory } from "./factory/base-listener-factory";
import { createEventListenerPair } from "./factory/event-listener-pair";

type ConnectFnThis<SO, TO> = readonly [
  (props: HubConnectProps<SO, TO>) => Promise<Bus<SO, TO>>,
  InternalHandlerRegistries<SO, TO, any>,
  SerializerRF<SO, TO, any>,
];

const serverEventTypes: ServerEventType[] = [
  "connect",
  "predisconnect",
  "postdisconnect",
];

const createServerEventListeners = baseListenerFactory(
  serverEventTypes,
  Set<() => void>,
);

function connectFn<SO, TO>(
  this: ConnectFnThis<SO, TO>,
  transportFactory: TransportFactory<SO, TO, any>,
) {
  const [connect, transportHandlers, serializer] = this;
  const transport: TransportRF<SO, TO, any> = [
    transportHandlers,
    transportFactory,
  ];
  const props: HubConnectProps<SO, TO> = { transport, serializer };
  connect(props);
}

type TransportHelperThis<SO, TO> = readonly [
  TransportServer<SO, TO, any>,
  TransportConnectFn<SO, TO, any>,
  ManageEventListenerPair<ServerEventType>,
];

function transportHelper<SO, TO>(
  this: TransportHelperThis<SO, TO>,
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, any>>,
) {
  return this[0](shinkaOn, this[1], this[2]);
}

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

export type ServerOptions<SO, TO> = HubOptions<SO, TO> & {
  transport: TransportServer<SO, TO, any>;
  serializer?: SerializerRoot<SO, TO, any>;
};

export class Server<SO, TO> {
  #hub!: Hub<SO, TO>;
  #connectDelegate!: DelegateType<TransportConnectFn<SO, TO, any>>;
  #vars!: ServerVars;
  #connectFn!: TransportConnectFn<SO, TO, any>;
  #callEvent!: (type: ServerEventType, ...args: any) => void;

  public onRequest!: ShinkaOnRequest<SO, TO, Bus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<Bus<SO, TO>>;
  public addEventListener!: ManageEventListener<Bus<SO, TO>>;
  public removeEventListener!: ManageEventListener<Bus<SO, TO>>;

  public extra!: Record<string | symbol, any>;

  constructor({
    outscope,
    transport: transportServerFactory,
    serializer: serializerRoot = defaultSerializerRoot,
    responseTimeout = defaultRequestTimeout,
  }: ServerOptions<SO, TO>) {
    this.#hub = new Hub({ outscope, responseTimeout });
    this.#vars = { state: ServerState.STOPPED };
    const [listeners, callEvent] = createEventListenerPair(
      createServerEventListeners,
    );
    this.#callEvent = callEvent;
    this.#connectDelegate = delegate(
      connectDefault as TransportConnectFn<SO, TO, any>,
    );
    const [transportRegistries] = setupHandlerRegistries(
      (transportHelper<SO, TO>).bind([
        transportServerFactory,
        this.#connectDelegate.call,
        listeners,
      ]),
    );

    const serializerRF = setupHandlerRegistries(serializerRoot);

    this.#connectFn = (connectFn<SO, TO>).bind([
      this.#hub.connect,
      transportRegistries,
      serializerRF,
    ]);

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
