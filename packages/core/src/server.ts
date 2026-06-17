import { delegate, type DelegateType } from "@shinka-rpc/util";

import {
  Hub,
  type HubOptions,
  type HandlerRegistriesHub,
  type HubConnectProps,
} from "./hub";

import {
  defaultRequestTimeout,
  defaultexchangeTimeoutThreshold,
  defaultSerializerRoot,
  defaultExchangeTimeout,
} from "./constants";

import type { Bus } from "./bus";
import type {
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  ManageEventListener,
  SerializerRoot,
  InternalHandlerThisArg,
  SerializerFactory,
  TransportServer,
  TransportFactory,
  Factories,
  TransportConnectFnBus,
  ShinkaOnBus,
  ServerManageEventListenerAll,
  ServerEventType,
  ServerEventListener,
} from "./types";

import { setupHandlerRegistries } from "./shinka";

import { baseListenerFactory } from "./factory/base-listener-factory";

type ConnectFnThis<SO, TO> = readonly [
  (props: HubConnectProps<SO, TO>) => Promise<Bus<SO, TO>>,
  HandlerRegistriesHub<SO, TO>,
  SerializerFactory<SO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
];

const serverEventTypes: ServerEventType[] = [
  "connect",
  "predisconnect",
  "postdisconnect",
];

const createServerEventListeners = baseListenerFactory(
  serverEventTypes,
  Set<ServerEventListener>,
);

const createServerEventListenerPair = () => {
  const listeners = createServerEventListeners();

  const add = (type: ServerEventType, cb: ServerEventListener) => {
    listeners[type].add(cb);
  };

  const remove = (type: ServerEventType, cb: ServerEventListener) => {
    listeners[type].delete(cb);
  };

  const call = (type: ServerEventType) => {
    for (const cb of listeners[type]) cb();
  };

  const all: ServerManageEventListenerAll = Object.freeze({ add, remove });

  return [all, call] as [typeof all, typeof call];
};

function connectFn<SO, TO>(
  this: ConnectFnThis<SO, TO>,
  transport: TransportFactory<TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
) {
  const [connect, handlerRegistries, serializer] = this;
  const factories: Factories<SO, TO> = { transport, serializer };
  const props: HubConnectProps<SO, TO> = { factories, handlerRegistries };
  connect(props);
}

type TransportHelperThis<SO, TO> = readonly [
  TransportServer<SO, TO>,
  TransportConnectFnBus<SO, TO>,
  ServerManageEventListenerAll,
];

function transportHelper<SO, TO>(
  this: TransportHelperThis<SO, TO>,
  shinkaOn: ShinkaOnBus<SO, TO>,
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

export type ServerOptions<SO, TO> = HubOptions & {
  transport: TransportServer<SO, TO>;
  serializer?: SerializerRoot<
    SO,
    TO,
    InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
  >;
};

export class Server<SO, TO> {
  private hub!: Hub<SO, TO>;
  private connectDelegate!: DelegateType<TransportConnectFnBus<SO, TO>>;
  private vars!: ServerVars;
  private connectFn!: TransportConnectFnBus<SO, TO>;
  private callEvent!: (type: ServerEventType, payload?: any) => void;

  public onRequest!: ShinkaOnRequest<SO, TO, Bus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<Bus<SO, TO>>;
  public addEventListener!: ManageEventListener<Bus<SO, TO>>;
  public removeEventListener!: ManageEventListener<Bus<SO, TO>>;

  public extra!: Record<string | symbol, any>;

  constructor({
    transport: transportServerFactory,
    serializer: serializerRoot = defaultSerializerRoot,
    responseTimeout = defaultRequestTimeout,
    exchangeTimeout = defaultExchangeTimeout,
    exchangeTimeoutThreshold = defaultexchangeTimeoutThreshold,
  }: ServerOptions<SO, TO>) {
    this.hub = new Hub({
      responseTimeout,
      exchangeTimeout,
      exchangeTimeoutThreshold,
    });
    this.vars = { state: ServerState.STOPPED };
    const [listeners, callEvent] = createServerEventListenerPair();
    this.callEvent = callEvent;
    this.connectDelegate = delegate(
      connectDefault as TransportConnectFnBus<SO, TO>,
    );
    const [transportRegistries] = setupHandlerRegistries(
      (transportHelper<SO, TO>).bind([
        transportServerFactory,
        this.connectDelegate.call,
        listeners,
      ]),
    );

    const [serializerRegistries, serializerFactory] =
      setupHandlerRegistries(serializerRoot);

    const handlerRegistries: HandlerRegistriesHub<SO, TO> = {
      transport: transportRegistries,
      serializer: serializerRegistries,
    };

    this.connectFn = (connectFn<SO, TO>).bind([
      this.hub.connect,
      handlerRegistries,
      serializerFactory,
    ]);

    this.onDataEvent = this.hub.onDataEvent;
    this.onRequest = this.hub.onRequest;
    this.addEventListener = this.hub.addEventListener;
    this.removeEventListener = this.hub.removeEventListener;
    this.extra = this.hub.extra;

    Object.freeze(this);
  }

  start = () => {
    if (this.vars.state !== ServerState.STOPPED)
      return console.error("Server is not in `STOPPED` state");
    this.connectDelegate.set(this.connectFn);
    this.callEvent("connect");
    this.vars.state = ServerState.STARTED;
  };

  stop = async () => {
    if (this.vars.state !== ServerState.STARTED)
      return console.error("Server is not in `STARTED` state");
    this.vars.state = ServerState.STOPPING;
    this.callEvent("predisconnect");
    this.connectDelegate.reset();
    try {
      await this.hub.dispose();
    } catch (e) {
      console.trace(e);
    }
    this.callEvent("postdisconnect");
    this.vars.state = ServerState.STOPPED;
  };

  public get size() {
    return this.hub.size;
  }
}
