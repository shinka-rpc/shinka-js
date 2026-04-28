import { defaultSerializer, defaultRequestTimeout } from "./constants";

import { CommonBus } from "./common";

import {
  createEventHandler,
  createRequestHandler,
  createReqRegistry,
  createEventRegistry,
  asOnRequest,
} from "./factory/registry";

import type {
  DataEventKey,
  RequestHandler,
  ShinkaMeta,
  ServerBusConnectProps,
  SerializerFactory,
  ShinkaEventListeners,
  AddRemoveEventListener,
} from "./types";

export type ServerOptions = {
  serializer?: SerializerFactory;
  timeout?: number;
};

type ShinkaEventHandlerProxies = {
  connect: (bus: CommonBus) => void;
  disconnect: (bus: CommonBus) => void;
};

const createShinkaEventHandlerProxy =
  (set: Set<(bus: CommonBus) => void>) => (bus: CommonBus) => {
    for (const fn of set) queueMicrotask(() => fn(bus));
  };

const createShinkaEventHandlerProxies = (
  eventListeners: ShinkaEventListeners,
) =>
  ({
    connect: createShinkaEventHandlerProxy(eventListeners.connect),
    disconnect: createShinkaEventHandlerProxy(eventListeners.disconnect),
  }) as ShinkaEventHandlerProxies;

export class ServerBus {
  protected eventListeners!: ShinkaEventListeners;
  private eventListenerProxies!: ShinkaEventHandlerProxies;
  private serializerFactory!: SerializerFactory;
  private timeout!: number;

  public onRequest!: (
    key: DataEventKey,
    fn: (data: any, thisArg: CommonBus) => any,
    metadata?: ShinkaMeta,
  ) => void;

  public onDataEvent!: (
    key: DataEventKey,
    fn: (data: any, thisArg: CommonBus) => void,
  ) => void;

  private requestHandler!: RequestHandler<CommonBus, any>;
  private eventHandler!: (
    key: DataEventKey,
    body: any,
    thisArg: CommonBus,
  ) => void;
  private clients!: Set<CommonBus>;

  public extra!: Record<string | symbol, any>;

  constructor({
    serializer = defaultSerializer,
    timeout = defaultRequestTimeout,
  }: ServerOptions) {
    const clients = new Set<CommonBus>();
    this.eventListeners = {
      connect: new Set(),
      disconnect: new Set(),
    };
    this.eventListenerProxies = createShinkaEventHandlerProxies(
      this.eventListeners,
    );
    this.serializerFactory = serializer;
    this.timeout = timeout;
    this.clients = clients;
    this.extra = {};
    //===
    const [reqGet, reqSet] = createReqRegistry<CommonBus, any, any>();
    const [evGet, evSet] = createEventRegistry<CommonBus, any>();

    this.onRequest = asOnRequest(reqSet);
    this.onDataEvent = evSet;
    this.requestHandler = createRequestHandler(reqGet);
    this.eventHandler = createEventHandler(evGet);
  }

  public connect = async ({
    transport,
    serializer = this.serializerFactory,
    responseTimeout = this.timeout,
    complete = () => {},
  }: ServerBusConnectProps<CommonBus>) => {
    const bus = new CommonBus();
    bus.__lazyInit(
      transport,
      serializer,
      this.requestHandler,
      this.eventHandler,
      responseTimeout,
    );
    bus.addEventListener("connect", this.eventListenerProxies.connect);
    bus.addEventListener("disconnect", this.eventListenerProxies.disconnect);
    complete(bus);
    await bus.start();
    this.clients.add(bus);
    return bus;
  };

  public addEventListener: AddRemoveEventListener = (type, target) =>
    this.eventListeners[type].add(target);

  public removeEventListener: AddRemoveEventListener = (type, target) =>
    this.eventListeners[type].delete(target);
}
