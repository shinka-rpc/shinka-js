import { delegate, type DelegateType } from "@shinka-rpc/util";
import { FIFO, type IQueue } from "@shinka-rpc/collections";
import { Semaphore } from "@shinka-rpc/concurrency";

import {
  createSendData,
  createOnRawData,
} from "../factory/serializer-strategy";
import {
  createEventListeners,
  createEventListenersBanned,
} from "../factory/event-listeners-bus";
import {
  messageTypeTransport,
  messageTypeSerializer,
  messageTypeBus,
  messageTypeUser,
  messageTypeLimon,
  messageTypeNB,
} from "../factory/message-type";

import type { OutScope } from "@shinka-rpc/outscope";

import type {
  SendFn,
  DispatchMap,
  Message,
  ManageEventListener,
  EventListenerType,
  ShinkaEventListeners,
  ShinkaListenerLayers,
  InternalHandlerThisArg,
  LastDataAt,
  ShinkaDataEvent,
  ShinkaRequest,
  LiMonThisArg,
  SerializerInitOpts,
  TransportRF,
  SerializerRF,
  LiMonRF,
  UserHandlerRegistries,
  ShinkaAndThisArgAll,
  NBThisArg,
  NB_FIFOEntry,
  NBThisArgSetVars,
} from "../types";

import { defaultRequestTimeout, defaultExclusiveLock } from "../defaults";
import { makeCreateOrCompleteShinka } from "../shinka";

import { busEvents, busRequests, busHandlerRegistries } from "./handlers/bus";
import {
  nbHandlerRegistries,
  type NBThisArgState,
} from "./handlers/non-blocking";
import { NBAcquire } from "./const-enums";
import {
  clearState,
  FIFOPush,
  drain,
  acquireMe,
  gracefulShutdown,
  byeReset,
  onTerminated,
  nbEventAcquire,
  nbEventAccept,
  nbEventRelease,
  eventListenerCaller,
  type VarsBye,
} from "./util";

const transportNotInitialized = () => {
  throw new Error("Transport is not initialized");
};

const dummy = () => {};

const enum BusState {
  STOPPED = 0,
  STARTING = 1,
  STARTED = 2,
  STOPPING = 3,
}

type BusVars = VarsBye & {
  state: BusState;
};

type DispatchErrors = {
  send: (error: any) => void;
  recv: (error: any) => void;
};

// TODO: make protocol also overridable
const defaultSerializerOpts: SerializerInitOpts = Object.freeze({
  root: "array",
});

// ===

export class Bus<SO, TO> {
  #outscope!: OutScope;
  #sta!: ShinkaAndThisArgAll<SO, TO, any>;
  #dispatchMap!: DispatchMap;
  #sendDelegate!: DelegateType<SendFn<SO, TO>>;
  #transportCloseDelegate!: DelegateType<() => Promise<void>>;
  #serializerStopDelegate!: DelegateType<() => void>;
  #limonStopDelegate!: DelegateType<() => void>;
  #onOutScopeDelegate!: DelegateType<() => void>;
  #eventListeners!: ShinkaListenerLayers<typeof this>;
  #lastDataAt!: LastDataAt;
  #vars!: BusVars;
  #dispatchErrors!: DispatchErrors;
  #onTerminated!: () => void;
  #resetStatesQueue!: IQueue<() => void>;

  public request!: ShinkaRequest<SO, TO>;
  public dataEvent!: ShinkaDataEvent<SO, TO>;
  public extra!: Record<string | symbol, any>;

  constructor(
    outscope: OutScope,
    transportRF: TransportRF<SO, TO, any>,
    serializerRF: SerializerRF<SO, TO, any>,
    limonRF: LiMonRF<SO, TO, any> | null,
    userRegistries: UserHandlerRegistries<SO, TO, Bus<SO, TO>>,
    eventListeners: ShinkaEventListeners<Bus<SO, TO>>,
    exclusiveLockInstance = defaultExclusiveLock,
    responseTimeout = defaultRequestTimeout,
  ) {
    this.#outscope = outscope;
    const { 0: transportRegistries, 1: transportFactory } = transportRF;
    const { 0: serializerRegistries, 1: serializerFactory } = serializerRF;
    this.#resetStatesQueue = new FIFO();

    this.#eventListeners = {
      own: createEventListeners(),
      parent: eventListeners,
      banned: createEventListenersBanned(),
    };
    this.#dispatchMap = new Map();
    this.#lastDataAt = Object.seal({ sent: 0, received: 0 });
    this.#vars = Object.seal({ state: BusState.STOPPED, bye: 0 });
    this.#sendDelegate = delegate(transportNotInitialized as SendFn<any, any>);
    this.#transportCloseDelegate = delegate(
      transportNotInitialized as () => Promise<void>,
    );
    this.#serializerStopDelegate = delegate(dummy);
    this.#limonStopDelegate = delegate(dummy);
    this.#onOutScopeDelegate = delegate(dummy);

    this.#dispatchErrors = {
      send: (error) =>
        this.#callEventListeners("error", {
          message: "Failed to send data",
          error,
        }),
      recv: (error) =>
        this.#callEventListeners("error", {
          message: "Failed to handle received data",
          error,
        }),
    };

    const send = this.#sendDelegate.call;
    const nbTA = {} as any as NBThisArg<SO, TO, any>;

    const nbTAState: NBThisArgState = {};

    const dispatchError = (error: any) =>
      this.#callEventListeners("error", error);

    const createOrCompleteShinka = makeCreateOrCompleteShinka<SO, TO, any>(
      this.#dispatchMap,
      responseTimeout,
    );

    const { 0: busSetVars, 1: busShinka } = createOrCompleteShinka(
      messageTypeBus,
      busHandlerRegistries,
    );

    const { 0: nbSetVars, 1: nbShinka } = createOrCompleteShinka(
      messageTypeNB,
      nbHandlerRegistries,
    );

    const { 0: serializerSetVars, 1: serializerShinka } =
      createOrCompleteShinka(messageTypeSerializer, serializerRegistries);

    const { 0: transportSetVars, 1: transportShinka } = createOrCompleteShinka(
      messageTypeTransport,
      transportRegistries,
    );

    const { 0: userSetVars, 1: userShinka } = createOrCompleteShinka(
      messageTypeUser,
      userRegistries,
    );

    const busTAState = {};
    this.#resetStatesQueue.push(clearState(busTAState));

    const busTA: InternalHandlerThisArg<SO, TO, any> = Object.freeze({
      bus: this,
      shinka: busShinka,
      state: busTAState,
      exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.BUS),
      dispatchError,
    });

    const serializerTAState = {};
    this.#resetStatesQueue.push(clearState(serializerTAState));

    const serializerTA: InternalHandlerThisArg<SO, TO, any> = Object.freeze({
      bus: this,
      shinka: serializerShinka,
      state: serializerTAState,
      exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.SERIALIZER),
      dispatchError,
    });

    const transportTAState = {};
    this.#resetStatesQueue.push(clearState(transportTAState));

    const transportTA: InternalHandlerThisArg<SO, TO, any> = Object.freeze({
      bus: this,
      shinka: transportShinka,
      state: transportTAState,
      exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.TRANSPORT),
      dispatchError,
    });
    this.#resetStatesQueue.push(clearState(nbTAState));

    const nbTA_FIFO = new FIFO<NB_FIFOEntry<SO, TO>>();

    const nbTASetVars: NBThisArgSetVars<SO, TO, any> = {
      user: userSetVars,
      bus: busSetVars,
      nb: nbSetVars,
      transport: transportSetVars,
      serializer: serializerSetVars,
      limon: null,
    };

    // const raceResolvedEvent = new ReusablePromise<void>();
    // raceResolvedEvent.resolve();
    // const concurrent = {
    //   semaphore: new Semaphore({ waiters: FIFO, capacity: 1 }),
    //   raceResolvedEvent,
    // };

    Object.assign(nbTA, {
      bus: this,
      shinka: nbShinka,
      state: nbTAState,
      // concurrent,
      semaphore: new Semaphore({ waiters: FIFO, capacity: 1 }),
      exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.NB),
      q: {
        drain: (drain<SO, TO>).bind(0, nbTA_FIFO, send),
        clear: nbTA_FIFO.truncate,
      },
      vars: {
        set: nbTASetVars,
        val: {
          lock: { send: (FIFOPush<SO, TO>).bind(nbTA_FIFO) },
          release: { send },
        },
      },
      api: {
        e: {
          acquire: (nbEventAcquire<SO, TO>).bind(nbShinka),
          accept: (nbEventAccept<SO, TO>).bind(nbShinka),
          release: (nbEventRelease<SO, TO>).bind(nbShinka),
        },
        r: {},
      },
      dispatchError,
      lock: exclusiveLockInstance,
      responseTimeout,
    } as NBThisArg<SO, TO, any>);

    Object.freeze(nbTA);

    busSetVars({ thisArg: busTA, dispatchError, send });
    nbSetVars({ thisArg: nbTA, dispatchError, send });
    serializerSetVars({ thisArg: serializerTA, dispatchError, send });
    transportSetVars({ thisArg: transportTA, dispatchError, send });
    userSetVars({ thisArg: this, dispatchError, send });

    this.#sta = {
      transport: {
        shinka: transportShinka,
        TA: transportTA,
        factory: transportFactory,
      },
      serializer: {
        shinka: serializerShinka,
        TA: serializerTA,
        factory: serializerFactory,
      },
      bus: { shinka: busShinka, TA: busTA },
      nb: { shinka: nbShinka, TA: nbTA },
      limon: null,
      user: userShinka,
    };

    if (limonRF !== null) {
      const { 0: limonRegistries, 1: limonFactory } = limonRF;
      const { 0: limonSetVars, 1: limonShinka } = createOrCompleteShinka(
        messageTypeLimon,
        limonRegistries,
      );

      const limonTAState = {};
      this.#resetStatesQueue.push(clearState(limonTAState));

      const limonTA: LiMonThisArg<SO, TO, any> = Object.freeze({
        bus: this,
        shinka: limonShinka,
        heartbeat: () => busEvents.heartbeat(busShinka.dataEvent),
        last: this.#lastDataAt,
        state: limonTAState,
        exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.LIMON),
        dispatchError,
      });
      limonSetVars({ thisArg: limonTA, dispatchError, send });
      this.#sta.limon = {
        shinka: limonShinka,
        TA: limonTA,
        factory: limonFactory,
      };
      nbTASetVars.limon = limonSetVars;
    }

    this.#onTerminated = onTerminated.bind(
      0,
      this.#vars,
      this.#transportCloseDelegate.reset,
      this.stop,
    );

    this.request = userShinka.request;
    this.dataEvent = userShinka.dataEvent;

    this.extra = {};
  }

  #callEventListeners = (type: EventListenerType, target: any) => {
    const own = this.#eventListeners.own[type];
    for (const listener of own)
      queueMicrotask(
        (eventListenerCaller<this>).bind(0, listener, this, target),
      );

    const banned = this.#eventListeners.banned[type];
    for (const listener of this.#eventListeners.parent[type])
      if (!(banned.has(listener) || own.has(listener)))
        queueMicrotask(
          (eventListenerCaller<this>).bind(0, listener, this, target),
        );
  };

  public start = async () => {
    if (this.#vars.state === BusState.STARTED) return;
    if (this.#vars.state !== BusState.STOPPED)
      return this.#callEventListeners("error", {
        message: "Bus is not in `STOPPED` state",
        when: "start",
      });

    try {
      this.#vars.state = BusState.STARTING;

      let limonStart: (() => void) | null = null;
      if (this.#sta.limon) {
        const limonInstance = this.#sta.limon.factory(this.#sta.limon.TA);
        this.#limonStopDelegate.set(limonInstance.stop);
        limonStart = limonInstance.start;
      }

      const maybeSerializerInstance = this.#sta.serializer.factory(
        this.#sta.serializer.TA,
        defaultSerializerOpts,
      );
      const {
        serialize,
        deserialize,
        onReady: onReadySerializer,
        stop: stopSerializer,
        transportInitOpts,
        typeHints,
      } = maybeSerializerInstance instanceof Promise
        ? await maybeSerializerInstance
        : maybeSerializerInstance;

      if (stopSerializer) this.#serializerStopDelegate.set(stopSerializer);

      const onRawData = createOnRawData(
        typeHints.deserialize,
        deserialize,
        this.#dispatch,
        this.#dispatchErrors.recv,
        this.#lastDataAt,
      );

      const maybeTransportInstance = this.#sta.transport.factory(
        this.#sta.transport.TA,
        onRawData,
        this.#onTerminated,
        transportInitOpts,
      );
      const {
        send: sendSerialized,
        close,
        instruction,
        onReady: onReadyTransport,
      } = maybeTransportInstance instanceof Promise
        ? await maybeTransportInstance
        : maybeTransportInstance;

      this.#transportCloseDelegate.set(close);

      const send = createSendData(
        typeHints.serialize,
        serialize,
        sendSerialized,
        this.#dispatchErrors.send,
        this.#lastDataAt,
      );

      this.#sendDelegate.set(send);

      if (onReadyTransport) {
        const onReadyTransportPromise = onReadyTransport();
        if (onReadyTransportPromise instanceof Promise)
          await onReadyTransportPromise;
      }
      if (onReadySerializer) {
        const onReadySerializerPromise = onReadySerializer();
        if (onReadySerializerPromise instanceof Promise)
          await onReadySerializerPromise;
      }

      if (limonStart) limonStart();
      this.#sta.nb.TA.lock.start(this.#sta.nb.TA);

      if (instruction.hi && !this.#lastDataAt.sent)
        busEvents.heartbeat(this.#sta.bus.shinka.dataEvent);

      if (instruction.bye) this.#vars.bye = 1;
      const onOutScope = instruction.bye
        ? gracefulShutdown.bind(
            0,
            this.#sta.bus.shinka.dataEvent,
            byeReset.bind(this.#vars),
            this.stop,
          )
        : this.stop;

      this.#onOutScopeDelegate.set(onOutScope);
      this.#outscope.add(this.#onOutScopeDelegate.call);
      this.#vars.state = BusState.STARTED;
      this.#callEventListeners("connect", null);
    } catch (e) {
      this.#callEventListeners("error", e);
      try {
        await this.#transportCloseDelegate.call();
      } catch (e2) {
        this.#callEventListeners("error", e2);
      }
      this.#cleanup();
      throw e;
    }
  };

  public stop = async () => {
    if (this.#vars.state === BusState.STOPPED) return;
    if (this.#vars.state !== BusState.STARTED)
      return this.#callEventListeners("error", {
        message: "Bus is not in `STARTED` state",
        when: "stop",
      });

    this.#vars.state = BusState.STOPPING;

    if (this.#vars.bye) busEvents.terminate(this.#sta.bus.shinka.dataEvent);

    try {
      await this.#transportCloseDelegate.call();
    } catch (e) {
      this.#callEventListeners("error", e);
    }

    this.#serializerStopDelegate.call();
    this.#limonStopDelegate.call();

    this.#sta.nb.TA.lock.stop(this.#sta.nb.TA);

    this.#cleanup();

    this.#callEventListeners("disconnect", null);
  };

  public restart = async () => {
    try {
      await this.stop();
    } catch (e) {
      this.#callEventListeners("error", e);
    }
    await this.start();
  };

  public ping = async () => {
    const begin = performance.now();
    await busRequests.ping(this.#sta.bus.shinka.request);
    return performance.now() - begin;
  };

  public addEventListener: ManageEventListener<this> = (type, target) => {
    this.#eventListeners.banned[type].delete(target);
    this.#eventListeners.own[type].add(target);
  };

  public removeEventListener: ManageEventListener<this> = (type, target) => {
    this.#eventListeners.banned[type].add(target);
    this.#eventListeners.own[type].delete(target);
  };

  #dispatch = (message: Message<any>) => {
    try {
      const messageType = message[0];
      const dispatchHandler = this.#dispatchMap.get(messageType);

      if (!dispatchHandler)
        throw { message: "Unknown message type", messageType };

      dispatchHandler(message as any);
    } catch (e) {
      this.#callEventListeners("error", e);
    }
  };

  #cleanup = () => {
    for (const cb of this.#resetStatesQueue) cb();

    this.#onOutScopeDelegate.reset();
    this.#outscope.remove(this.#onOutScopeDelegate.call);
    this.#sendDelegate.reset();
    this.#serializerStopDelegate.reset();
    this.#limonStopDelegate.reset();
    this.#transportCloseDelegate.reset();
    this.#vars.bye = 0;

    this.#vars.state = BusState.STOPPED;
  };
}
