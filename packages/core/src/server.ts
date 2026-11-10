import { delegate, type DelegateType } from "@shinka-rpc/util";
import { createCoalescingTransition } from "@shinka-rpc/concurrency";

import { Hub } from "./hub";

import { defaultSerializerRoot, defaultExclusiveLock } from "./defaults";
import { setupHandlerRegistries } from "./shinka";
import type { Bus } from "./bus";

import type {
  InternalHandlerThisArg,
  TransportServer,
  TransportFactory,
  TransportConnectFn,
  ServerTransportEventType,
  InternalHandlerRegistries,
  IBus,
  BusProps,
  ServerOptions,
} from "./types";
import type {
  BaseManageEventListener,
  EventListenerType,
  ManageEventListenerPair,
  ShinkaEventListener,
} from "./listeners/types";
import type { ShinkaOnRequest, ShinkaOnDataEvent, ShinkaOn } from "./shinka";

import { baseListenerFactory } from "./listeners/base-listener-factory";
import { eventListenerTypes } from "./listeners/event-listeners-bus";
import { createEventListenerPair } from "./listeners/event-listener-pair";

const { freeze: objectFreeze } = Object;

const dummy = () => {};

const transportEventTypes: ServerTransportEventType[] = [
  "started",
  "stopping",
  "stopped",
];

const createTransportEventListeners = baseListenerFactory(
  transportEventTypes,
  Set<() => void>,
);

type ServerOnlyEventType = "enabled" | "enabling" | "disabled" | "disabling";
type ServerEventTypes = ServerOnlyEventType | EventListenerType;

const serverEventTypes: ServerEventTypes[] = [
  ...eventListenerTypes,
  "enabled",
  "enabling",
  "disabled",
  "disabling",
];

type ServerManageEventListener<B> = BaseManageEventListener<
  ServerEventTypes,
  ShinkaEventListener<B>
>;

const createServerEventListeners = baseListenerFactory(
  serverEventTypes,
  Set<() => void>,
);

const connectFn = async <SO, TO, TC>(
  create: (props: BusProps<SO, TO, TC>) => Bus<SO, TO, TC>,
  transportHandlers: InternalHandlerRegistries<SO, TO, any>,
  baseProps: Omit<BusProps<SO, TO, TC>, "transport">,
  transportFactory: TransportFactory<SO, TO, any, TC>,
) => {
  const bus = create({
    ...baseProps,
    transport: [transportHandlers, transportFactory],
  });
  await bus.start();
  return bus;
};

const transportHelper = <SO, TO, TC>(
  transportServer: TransportServer<SO, TO, any, TC>,
  connect: TransportConnectFn<SO, TO, any, TC>,
  listeners: ManageEventListenerPair<ServerTransportEventType>,
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, any>>,
) => transportServer(shinkaOn, connect, listeners);

const connectDefault = () => {
  throw new Error("Server is not started!");
};

const enum ServerState {
  STOPPED = 0,
  STARTING = 2, // `Server.start()` is sync. This state is fictitious
  STARTED = 3,
  STOPPING = 4,
}

export class Server<SO = any, TO = any, TC = any> {
  #hub: Hub<SO, TO, TC>;
  #connectDelegate: DelegateType<TransportConnectFn<SO, TO, any, TC>>;
  #connectFn: TransportConnectFn<SO, TO, any, TC>;
  #callTransportEvent: (type: ServerTransportEventType, ...args: any) => void;
  #getLFState: () => ServerState;
  #eventListeners: Record<
    ServerEventTypes,
    Set<(target: any, payload: any) => void>
  >;
  #dispatchDisabled: () => void;

  public onRequest: ShinkaOnRequest<SO, TO, IBus<SO, TO>>;
  public onDataEvent: ShinkaOnDataEvent<IBus<SO, TO>>;
  public addEventListener: ServerManageEventListener<any>;
  public removeEventListener: ServerManageEventListener<any>;

  public start: () => Promise<void>;
  public stop: () => Promise<void>;

  public extra: Record<string | symbol, any>;

  constructor({
    outscope,
    transport: transportServerFactory,
    serializer: serializerRoot = defaultSerializerRoot,
    limon = null,
    responseTimeout,
    lock = defaultExclusiveLock,
    complete,
  }: ServerOptions<SO, TO, TC>) {
    const eventListeners = createServerEventListeners();
    this.#eventListeners = eventListeners;

    this.#hub = new Hub(eventListeners);

    const { 0: getLFState, 1: lfTransition } = createCoalescingTransition(
      ServerState.STOPPED,
    );

    this.#getLFState = getLFState;

    const { 0: listeners, 1: callEvent } = createEventListenerPair(
      createTransportEventListeners,
    );
    this.#callTransportEvent = callEvent;
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

    const baseProps: Omit<BusProps<SO, TO, TC>, "transport"> = {
      outscope,
      serializer: setupHandlerRegistries(serializerRoot),
      complete,
      limon: limon && setupHandlerRegistries(limon),
      lock,
      responseTimeout,
    };

    this.#connectFn = (connectFn<SO, TO, TC>).bind(
      0,
      this.#hub.create,
      transportRegistries,
      baseProps,
    );

    const dispatchError = this.#callEventListeners.bind(this, "error");
    const dispatchDisabled = this.#callEventListeners.bind(
      this,
      "disabled",
      this,
    );
    this.#dispatchDisabled = dispatchDisabled;

    this.start = lfTransition(
      ServerState.STARTED,
      ServerState.STARTING,
      this.#start,
      dummy, // `Server.start()` is sync. This transition is fictitious
      this.#callEventListeners.bind(this, "enabled", this),
      dispatchError,
    );

    this.stop = lfTransition(
      ServerState.STOPPED,
      ServerState.STOPPING,
      this.#stop,
      this.#callEventListeners.bind(this, "disabling", this),
      dispatchDisabled,
      dispatchError,
    );

    this.onDataEvent = this.#hub.onDataEvent;
    this.onRequest = this.#hub.onRequest;
    this.addEventListener = this.#hub
      .addEventListener as ServerManageEventListener<any>;
    this.removeEventListener = this.#hub
      .removeEventListener as ServerManageEventListener<any>;
    this.extra = this.#hub.extra;

    objectFreeze(this);
  }

  #start = () => {
    this.#connectDelegate.set(this.#connectFn);
    try {
      this.#callTransportEvent("started");
    } catch (e) {
      queueMicrotask(this.#cleanup);
      throw e;
    }
  };

  #cleanup = () => {
    this.#stop().finally(this.#dispatchDisabled);
  };

  #stop = async () => {
    try {
      // transport have to unsubscribe server. Mandatory
      this.#callTransportEvent("stopping");
    } catch (e) {
      this.#callEventListeners("error", e);
    }
    this.#connectDelegate.reset();
    await this.#hub.dispose();
    try {
      // transport is notified the server is finally stopped. Optional
      this.#callTransportEvent("stopped");
    } catch (e) {
      this.#callEventListeners("error", e);
    }
  };

  #callEventListeners = (type: ServerEventTypes, target: any) => {
    // used to emit ServerOnlyEventType
    for (const cb of this.#eventListeners[type])
      queueMicrotask(cb.bind(0, this, target));
  };

  public get size() {
    return this.#hub.size;
  }

  public get enabled() {
    return this.#getLFState() === ServerState.STARTED;
  }
}
