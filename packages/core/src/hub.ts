import { defaultSerializerRoot, defaultRequestTimeout } from "./constants";

import { CommonBus } from "./common";

import type {
  DataEventKey,
  RequestHandler,
  HandlerRegistriesAll,
  ShinkaMeta,
  ServerBusConnectProps,
  SerializerRoot,
  TransportRoot,
  ShinkaEventListeners,
  AddRemoveEventListener,
  Factories,
  ShinkaOnRequest,
  ShinkaOnDataEvent,
} from "./types";

import { type HandlerRegistries, createHandlerRegistries } from "./shinka";

export type ServerOptions = {
  // serializer?: SerializerRoot<SO, TO, CommonBus<SO, TO>>;
  // transport: TransportRoot<SO, TO, CommonBus<SO, TO>>;
  timeout?: number;
};

type ShinkaEventHandlerProxies<TA> = {
  connect: (bus: TA) => void;
  disconnect: (bus: TA) => void;
};

const createShinkaEventHandlerProxy =
  <TA>(set: Set<(bus: TA) => void>) =>
  (bus: TA) => {
    for (const fn of set) queueMicrotask(() => fn(bus));
  };

const createShinkaEventHandlerProxies = <TA>(
  eventListeners: ShinkaEventListeners<TA>,
) =>
  ({
    connect: createShinkaEventHandlerProxy(eventListeners.connect),
    disconnect: createShinkaEventHandlerProxy(eventListeners.disconnect),
  }) as ShinkaEventHandlerProxies<TA>;

export class Hub<SO, TO> {
  private userRegistries!: HandlerRegistries<SO, TO, CommonBus<SO, TO>>;
  private eventListeners!: ShinkaEventListeners<CommonBus<SO, TO>>;
  private eventListenerProxies!: ShinkaEventHandlerProxies<CommonBus<SO, TO>>;
  private timeout!: number;
  private clients!: Set<CommonBus<SO, TO>>;

  public onRequest!: ShinkaOnRequest<SO, TO, CommonBus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<CommonBus<SO, TO>>;

  public extra!: Record<string | symbol, any>;

  constructor({ timeout = defaultRequestTimeout }: ServerOptions) {
    this.timeout = timeout;
    this.userRegistries = createHandlerRegistries<SO, TO, CommonBus<SO, TO>>();
    this.clients = new Set<CommonBus<SO, TO>>();
    this.eventListeners = {
      connect: new Set(),
      disconnect: new Set(),
    };
    this.eventListenerProxies = createShinkaEventHandlerProxies(
      this.eventListeners,
    );
    this.extra = {};
    this.onRequest = this.userRegistries.onRequest;
    this.onDataEvent = this.userRegistries.onDataEvent;
    Object.freeze(this);
  }

  // public connect = async ({
  //   transport,
  //   serializer = defaultSerializerRoot,
  //   responseTimeout = this.timeout,
  //   // complete = () => {},
  // }: ServerBusConnectProps<SO, TO, CommonBus<SO, TO>>) => {
  //   const bus = new CommonBus(
  //     this.factories,
  //     this.handlerRegistries,
  //     responseTimeout,
  //   );

  //   bus.addEventListener("connect", this.eventListenerProxies.connect);
  //   bus.addEventListener("disconnect", this.eventListenerProxies.disconnect);
  //   // complete(bus);
  //   await bus.start();
  //   this.clients.add(bus);
  //   return bus;
  // };

  public addEventListener: AddRemoveEventListener<CommonBus<SO, TO>> = (
    type,
    target,
  ) => this.eventListeners[type].add(target);

  public removeEventListener: AddRemoveEventListener<CommonBus<SO, TO>> = (
    type,
    target,
  ) => this.eventListeners[type].delete(target);
}
