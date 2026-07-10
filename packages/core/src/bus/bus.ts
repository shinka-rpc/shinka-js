import { delegate, type DelegateType } from "@shinka-rpc/util";
import { banshee } from "@shinka-rpc/banshee";
import { FIFO } from "@shinka-rpc/collections";
import { Semaphore, ReusablePromise } from "@shinka-rpc/concurrency";

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

import { defaultRequestTimeout } from "../defaults";
import { makeCreateOrCompleteShinka } from "../shinka";

import { busEvents, busRequests, busHandlerRegistries } from "./handlers/bus";
import {
  nbHandlerRegistries,
  NBAcquire,
  type NBThisArgState,
} from "./handlers/non-blocking";
import { exclusiveLockAcquire } from "./exclusive-lock";
import { eventListenerCaller } from "./event-listener-caller";
import { gracefulShutdown } from "./graceful-shutdown";
import { type VarsBye, byeReset, onTerminated } from "./on-terminate";
import { clearState, createFIFOPush } from "./util";

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

const enum ResetStateIDX {
  BUS = 0,
  SERIALIZER = 1,
  TRANSPORT = 2,
  NB = 3,
  LIMON = 4,
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
  #sta!: ShinkaAndThisArgAll<SO, TO>;
  #dispatchMap!: DispatchMap;
  #sendDelegate!: DelegateType<SendFn<SO, TO>>;
  #transportCloseDelegate!: DelegateType<() => Promise<void>>;
  #serializerStopDelegate!: DelegateType<() => void>;
  #limonStopDelegate!: DelegateType<() => void>;
  #cleanupDelegate!: DelegateType<(callOnWail?: boolean) => void>;
  #eventListeners!: ShinkaListenerLayers<typeof this>;
  #lastDataAt!: LastDataAt;
  #vars!: BusVars;
  #dispatchErrors!: DispatchErrors;
  #onTerminated!: () => void;
  #resetStates!: (() => void)[];

  public request!: ShinkaRequest<SO, TO>;
  public dataEvent!: ShinkaDataEvent<SO, TO>;
  public extra!: Record<string | symbol, any>;

  constructor(
    transportRF: TransportRF<SO, TO, any>,
    serializerRF: SerializerRF<SO, TO, any>,
    limonRF: LiMonRF<SO, TO, any> | null,
    userRegistries: UserHandlerRegistries<SO, TO, Bus<SO, TO>>,
    eventListeners: ShinkaEventListeners<Bus<SO, TO>>,
    responseTimeout = defaultRequestTimeout,
  ) {
    const [transportRegistries, transportFactory] = transportRF;
    const [serializerRegistries, serializerFactory] = serializerRF;
    this.#resetStates = Array(limonRF ? 5 : 4);

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
    this.#cleanupDelegate = delegate(dummy);

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
    const semaphore = new Semaphore({ waiters: FIFO, count: 1 });
    const raceResolvedEvent = new ReusablePromise<void>();

    const nbTAState: NBThisArgState = {};

    const dispatchError = (error: any) =>
      this.#callEventListeners("error", error);

    const createOrCompleteShinka = makeCreateOrCompleteShinka<SO, TO, any>(
      this.#dispatchMap,
      responseTimeout,
    );

    const [busSetVars, busShinka] = createOrCompleteShinka(
      messageTypeBus,
      busHandlerRegistries,
    );

    const [nbSetVars, nbShinka] = createOrCompleteShinka(
      messageTypeNB,
      nbHandlerRegistries,
    );

    const [serializerSetVars, serializerShinka] = createOrCompleteShinka(
      messageTypeSerializer,
      serializerRegistries,
    );

    const [transportSetVars, transportShinka] = createOrCompleteShinka(
      messageTypeTransport,
      transportRegistries,
    );

    const [userSetVars, userShinka] = createOrCompleteShinka(
      messageTypeUser,
      userRegistries,
    );

    const busTAState = {};
    this.#resetStates[ResetStateIDX.BUS] = clearState(busTAState);

    const busTA: InternalHandlerThisArg<SO, TO, any> = Object.freeze({
      bus: this,
      shinka: busShinka,
      state: busTAState,
      exclusiveLock: exclusiveLockAcquire.bind([
        semaphore,
        raceResolvedEvent,
        NBAcquire.BUS,
        busShinka,
        nbTAState,
      ]),
      dispatchError,
    });

    const serializerTAState = {};
    this.#resetStates[ResetStateIDX.SERIALIZER] = clearState(serializerTAState);

    const serializerTA: InternalHandlerThisArg<SO, TO, any> = Object.freeze({
      bus: this,
      shinka: serializerShinka,
      state: serializerTAState,
      exclusiveLock: exclusiveLockAcquire.bind([
        semaphore,
        raceResolvedEvent,
        NBAcquire.SERIALIZER,
        serializerShinka,
        nbTAState,
      ]),
      dispatchError,
    });

    const transportTAState = {};
    this.#resetStates[ResetStateIDX.TRANSPORT] = clearState(transportTAState);

    const transportTA: InternalHandlerThisArg<SO, TO, any> = Object.freeze({
      bus: this,
      shinka: transportShinka,
      state: transportTAState,
      exclusiveLock: exclusiveLockAcquire.bind([
        semaphore,
        raceResolvedEvent,
        NBAcquire.TRANSPORT,
        transportShinka,
        nbTAState,
      ]),
      dispatchError,
    });
    this.#resetStates[ResetStateIDX.NB] = clearState(nbTAState);

    const nbTA_FIFO = new FIFO<NB_FIFOEntry<SO, TO>>();

    const nbTASetVars: NBThisArgSetVars<SO, TO> = {
      user: userSetVars,
      bus: busSetVars,
      nb: nbSetVars,
      transport: transportSetVars,
      serializer: serializerSetVars,
      limon: null,
    };

    const nbTA: NBThisArg<SO, TO> = Object.freeze({
      bus: this,
      shinka: nbShinka,
      state: nbTAState,
      exclusiveLock: exclusiveLockAcquire.bind([
        semaphore,
        raceResolvedEvent,
        NBAcquire.NB,
        nbShinka,
        nbTAState,
      ]),
      send,
      q: nbTA_FIFO,
      qPush: createFIFOPush(nbTA_FIFO),
      setVars: nbTASetVars,
      dispatchError,
      raceResolvedEvent,
    });

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
      const [limonRegistries, limonFactory] = limonRF;
      const [limonSetVars, limonShinka] = createOrCompleteShinka(
        messageTypeLimon,
        limonRegistries,
      );

      const limonTAState = {};
      this.#resetStates[ResetStateIDX.LIMON] = clearState(limonTAState);

      const limonTA: LiMonThisArg<SO, TO, any> = Object.freeze({
        bus: this,
        shinka: limonShinka,
        heartbeat: () => busEvents.heartbeat(busShinka.dataEvent),
        last: this.#lastDataAt,
        state: limonTAState,
        exclusiveLock: exclusiveLockAcquire.bind([
          semaphore,
          raceResolvedEvent,
          NBAcquire.LIMON,
          limonShinka,
          nbTAState,
        ]),
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

    this.#onTerminated = onTerminated.bind([
      this.#vars,
      this.#transportCloseDelegate.reset,
      this.stop,
    ]);

    this.request = userShinka.request;
    this.dataEvent = userShinka.dataEvent;

    this.extra = {};
  }

  #callEventListeners = (type: EventListenerType, target: any) => {
    const own = this.#eventListeners.own[type];
    for (const listener of own)
      queueMicrotask(
        (eventListenerCaller<this>).bind([listener, this, target]),
      );

    const banned = this.#eventListeners.banned[type];
    for (const listener of this.#eventListeners.parent[type])
      if (!(banned.has(listener) || own.has(listener)))
        queueMicrotask(
          (eventListenerCaller<this>).bind([listener, this, target]),
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

      if (instruction.hi && !this.#lastDataAt.sent)
        busEvents.heartbeat(this.#sta.bus.shinka.dataEvent);

      if (instruction.bye) this.#vars.bye = 1;
      const wail = instruction.bye
        ? gracefulShutdown.bind(
            Object.freeze([
              this.#sta.bus.shinka.dataEvent,
              byeReset.bind(this.#vars),
              this.stop,
            ]),
          )
        : this.stop;

      this.#cleanupDelegate.set(banshee(this, wail));
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
    for (const cb of this.#resetStates) cb();

    this.#cleanupDelegate.call(false);
    this.#sendDelegate.reset();
    this.#serializerStopDelegate.reset();
    this.#limonStopDelegate.reset();
    this.#transportCloseDelegate.reset();
    this.#cleanupDelegate.reset();
    this.#vars.bye = 0;

    this.#vars.state = BusState.STOPPED;
  };
}
