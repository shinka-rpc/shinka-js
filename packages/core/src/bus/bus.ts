import {
  curryClearObject,
  delegate,
  type DelegateType,
  type AsyncDisposeContext,
} from "@shinka-rpc/util";
import { FIFO, type IQueue } from "@shinka-rpc/collections";
import { Semaphore, ReusablePromise } from "@shinka-rpc/concurrency";

import { createSendData, createOnRawData } from "./serializer-strategy";
import {
  createEventListeners,
  createEventListenersBanned,
} from "../listeners/event-listeners-bus";
import {
  makeCreateOrCompleteShinka,
  messageTypeTransport,
  messageTypeSerializer,
  messageTypeBus,
  messageTypeUser,
  messageTypeLimon,
  messageTypeNB,
} from "../shinka";

import type {
  IBus,
  ShinkaEventListeners,
  ShinkaListenerLayers,
  InternalHandlerThisArg,
  LastDataAt,
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
  BusHandlerThisArg,
  CompleteFn,
  OutScope,
  AbortFn,
} from "../types";
import type {
  ManageEventListener,
  EventListenerType,
} from "../listeners/types";
import type {
  SendFn,
  DispatchMap,
  Message,
  ShinkaDoDataEvent,
  ShinkaDoRequest,
} from "../shinka";

import { defaultRequestTimeout, defaultExclusiveLock } from "../defaults";

import { busEvents, busRequests, busHandlerRegistries } from "./handlers/bus";
import {
  nbHandlerRegistries,
  type NBThisArgState,
} from "./handlers/non-blocking";
import { NBAcquire } from "./const-enums";
import {
  BusState,
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
  createTransition,
  type VarsBye,
  type TransitionVars,
} from "./util";

const { freeze: objectFreeze, seal: objectSeal, assign: objectAssign } = Object;

const transportNotInitialized = () => {
  throw new Error("Transport is not initialized");
};

const dummy = () => {};
const aDummy = async () => {};

type BusVars = VarsBye & TransitionVars;

type DispatchErrors = {
  send: (error: any) => void;
  recv: (error: any) => void;
};

// TODO: make protocol also overridable
const defaultSerializerOpts: SerializerInitOpts = objectFreeze({
  root: "array",
});

// ===

export class Bus<SO, TO, TC> implements IBus<SO, TO> {
  #outscope: OutScope;
  #sta: ShinkaAndThisArgAll<SO, TO, any>;
  #dispatchMap: DispatchMap;
  #sendDelegate: DelegateType<SendFn<SO, TO>>;
  #transportCloseDelegate: DelegateType<() => Promise<void>>;
  #serializerStopDelegate: DelegateType<() => void>;
  #limonStopDelegate: DelegateType<() => void>;
  #onOutScopeDelegate: DelegateType<() => void>;
  #eventListeners: ShinkaListenerLayers<typeof this>;
  #lastDataAt: LastDataAt;
  #vars: BusVars;
  #dispatchErrors: DispatchErrors;
  #onTerminated: () => void;
  #resetStatesQueue: IQueue<() => void>;
  #resetBye: () => void;
  #complete: CompleteFn<SO, TO, TC>;
  #dispatchError: (error: any) => void;

  public request: ShinkaDoRequest<SO, TO>;
  public dataEvent: ShinkaDoDataEvent<SO, TO>;
  public extra: Record<string | symbol, any>;
  public exclusiveLock: (timeout: number) => Promise<AsyncDisposeContext>;
  public start: () => Promise<void>;
  public stop: () => Promise<void>;

  constructor(
    outscope: OutScope,
    transportRF: TransportRF<SO, TO, any, TC>,
    serializerRF: SerializerRF<SO, TO, any>,
    limonRF: LiMonRF<SO, TO, any> | null,
    userRegistries: UserHandlerRegistries<SO, TO, IBus<SO, TO>>,
    eventListeners: ShinkaEventListeners<IBus<SO, TO>>,
    exclusiveLockInstance = defaultExclusiveLock,
    responseTimeout = defaultRequestTimeout,
    complete: CompleteFn<SO, TO, TC> = dummy,
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
    this.#lastDataAt = objectSeal({ sent: 0, received: 0 });

    const vars: BusVars = objectSeal({
      state: BusState.STOPPED,
      bye: 0,
      closed: 0,
      transition: null,
    });

    this.#vars = vars;

    this.start = createTransition.bind(
      0,
      vars,
      BusState.STARTED,
      BusState.STARTING,
      this.#start,
      this.#callEventListeners.bind(this, "connecting", null),
      new ReusablePromise(),
    );

    this.stop = createTransition.bind(
      0,
      vars,
      BusState.STOPPED,
      BusState.STOPPING,
      this.#stop,
      this.#callEventListeners.bind(this, "disconnecting", null),
      new ReusablePromise(),
    );

    this.#resetBye = byeReset.bind(vars);
    this.#sendDelegate = delegate(transportNotInitialized as SendFn<any, any>);
    this.#transportCloseDelegate = delegate(aDummy);
    this.#serializerStopDelegate = delegate(dummy);
    this.#limonStopDelegate = delegate(dummy);
    this.#onOutScopeDelegate = delegate(dummy);

    const dispatchError = this.#callEventListeners.bind(this, "error");
    this.#dispatchError = dispatchError;

    this.#dispatchErrors = {
      send: (error) => dispatchError({ message: "Failed to send data", error }),
      recv: (error) =>
        dispatchError({ message: "Failed to handle received data", error }),
    };

    const send = this.#sendDelegate.call;
    const nbTA = {} as any as NBThisArg<SO, TO, any>;

    const nbTAState: NBThisArgState = {};

    const createOrCompleteShinka = makeCreateOrCompleteShinka(
      this.#dispatchMap,
      responseTimeout,
    );

    const { 1: busSetVars, 2: busShinka } = createOrCompleteShinka<SO, TO, any>(
      messageTypeBus,
      busHandlerRegistries,
    );

    const { 1: nbSetVars, 2: nbShinka } = createOrCompleteShinka<SO, TO, any>(
      messageTypeNB,
      nbHandlerRegistries,
    );

    const {
      0: serializerOnAbort,
      1: serializerSetVars,
      2: serializerShinka,
    } = createOrCompleteShinka(messageTypeSerializer, serializerRegistries);

    const {
      0: transportOnAbort,
      1: transportSetVars,
      2: transportShinka,
    } = createOrCompleteShinka(messageTypeTransport, transportRegistries);

    const {
      0: userOnAbort,
      1: userSetVars,
      2: userShinka,
    } = createOrCompleteShinka(messageTypeUser, userRegistries);

    this.exclusiveLock = (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.USER);

    const busTAState = {};
    this.#resetStatesQueue.push(curryClearObject(busTAState));

    const limonAbortDelegate = delegate<AbortFn>(dummy);

    const busTA: BusHandlerThisArg<SO, TO, any> = objectFreeze({
      bus: this,
      shinka: busShinka,
      state: busTAState,
      exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.BUS),
      dispatchError,
      byeReset: this.#resetBye,
      abort: {
        U: userOnAbort,
        S: serializerOnAbort,
        L: limonAbortDelegate.call,
        T: transportOnAbort,
      },
    });

    const serializerTAState = {};
    this.#resetStatesQueue.push(curryClearObject(serializerTAState));

    const serializerTA: InternalHandlerThisArg<SO, TO, any> = objectFreeze({
      bus: this,
      shinka: serializerShinka,
      state: serializerTAState,
      exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.SERIALIZER),
      dispatchError,
    });

    const transportTAState = {};
    this.#resetStatesQueue.push(curryClearObject(transportTAState));

    const transportTA: InternalHandlerThisArg<SO, TO, any> = objectFreeze({
      bus: this,
      shinka: transportShinka,
      state: transportTAState,
      exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.TRANSPORT),
      dispatchError,
    });
    this.#resetStatesQueue.push(curryClearObject(nbTAState));

    const nbTA_FIFO = new FIFO<NB_FIFOEntry<SO, TO>>();

    const nbTASetVars: NBThisArgSetVars<SO, TO, any> = {
      user: userSetVars,
      bus: busSetVars,
      nb: nbSetVars,
      transport: transportSetVars,
      serializer: serializerSetVars,
      limon: null,
    };

    objectAssign(nbTA, {
      bus: this,
      shinka: nbShinka,
      state: nbTAState,
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

    objectFreeze(nbTA);

    busSetVars({ thisArg: busTA, dispatchError, send });
    nbSetVars({ thisArg: nbTA, dispatchError, send });
    serializerSetVars({
      thisArg: serializerTA,
      dispatchError,
      send,
      abort: busEvents.abortSerializer.bind(0, busShinka.dataEvent),
    });
    transportSetVars({
      thisArg: transportTA,
      dispatchError,
      send,
      abort: busEvents.abortTransport.bind(0, busShinka.dataEvent),
    });
    userSetVars({
      thisArg: this,
      dispatchError,
      send,
      abort: busEvents.abortUser.bind(0, busShinka.dataEvent),
    });

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
      const {
        0: limonOnAbort,
        1: limonSetVars,
        2: limonShinka,
      } = createOrCompleteShinka(messageTypeLimon, limonRegistries);

      limonAbortDelegate.set(limonOnAbort);

      const limonTAState = {};
      this.#resetStatesQueue.push(curryClearObject(limonTAState));

      const limonTA: LiMonThisArg<SO, TO, any> = objectFreeze({
        bus: this,
        shinka: limonShinka,
        heartbeat: () => busEvents.heartbeat(busShinka.dataEvent),
        last: this.#lastDataAt,
        state: limonTAState,
        exclusiveLock: (acquireMe<SO, TO>).bind(0, nbTA, NBAcquire.LIMON),
        dispatchError,
      });
      limonSetVars({
        thisArg: limonTA,
        dispatchError,
        send,
        abort: busEvents.abortLimon.bind(0, busShinka.dataEvent),
      });
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

    this.#complete = complete;

    this.request = userShinka.request;
    this.dataEvent = userShinka.dataEvent;

    this.extra = {};
  }

  #callEventListeners = (type: EventListenerType, target: any) => {
    const own = this.#eventListeners.own[type];
    for (const listener of own)
      queueMicrotask((eventListenerCaller<this>).bind(this, listener, target));

    const banned = this.#eventListeners.banned[type];
    for (const listener of this.#eventListeners.parent[type])
      if (!(banned.has(listener) || own.has(listener)))
        queueMicrotask(
          (eventListenerCaller<this>).bind(this, listener, target),
        );
  };

  #start = async () => {
    const dispatchError = this.#dispatchError;
    let error: any;
    try {
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

      try {
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
          context: transportCtx,
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

        try {
          if (onReadyTransport) await onReadyTransport();
          if (onReadySerializer) await onReadySerializer();

          this.#complete(transportCtx, this);

          const limonInstance =
            this.#sta.limon && this.#sta.limon.factory(this.#sta.limon.TA);
          if (limonInstance) {
            const { start: limonInstanceStart, stop: limonInstanceStop } =
              limonInstance;
            if (limonInstanceStart)
              try {
                await limonInstanceStart();
                if (limonInstanceStop)
                  this.#limonStopDelegate.set(limonInstanceStop);
              } catch (e4) {
                error = e4;
                dispatchError(e4);
                e4 = dummy; // sentinel. Why not?
                if (limonInstanceStop) {
                  try {
                    limonInstanceStop();
                  } catch (e) {
                    dispatchError(e);
                  }
                }
                throw e4;
              }
          }

          this.#sta.nb.TA.lock.start(this.#sta.nb.TA);

          if (instruction.hi && !this.#lastDataAt.sent) {
            // send doesn't throw but dispatchError
            busEvents.heartbeat(this.#sta.bus.shinka.dataEvent);
          }

          if (instruction.bye) this.#vars.bye = 1;
          this.#vars.closed = 0;

          const onOutScope = instruction.bye
            ? gracefulShutdown.bind(
                0,
                this.#sta.bus.shinka.dataEvent,
                this.#resetBye,
                this.stop,
              )
            : this.stop;

          try {
            this.#outscope.add(this.#onOutScopeDelegate.call);
            this.#onOutScopeDelegate.set(onOutScope);
            this.#vars.state = BusState.STARTED;
            this.#callEventListeners("connected", null);
          } catch (e4) {
            // outscope
            if (e4 !== dummy) {
              dispatchError(e4);
              error = e4;
              e4 = dummy;
            }
            try {
              this.#outscope.remove(this.#onOutScopeDelegate.call);
            } catch (e) {
              dispatchError(e);
            }
            try {
              this.#limonStopDelegate.call();
            } catch (e) {
              dispatchError(e);
            }
            throw e4;
          }
        } catch (e3) {
          // onReady + limon-init
          if (e3 !== dummy) {
            dispatchError(e3);
            error = e3;
            e3 = dummy;
          }
          try {
            await this.#transportCloseDelegate.call();
          } catch (e) {
            dispatchError(e);
          }
          throw e3;
        }
      } catch (e2) {
        // transport-init
        if (e2 !== dummy) {
          dispatchError(e2);
          error = e2;
          e2 = dummy;
        }
        try {
          this.#serializerStopDelegate.call();
        } catch (e) {
          dispatchError(e);
        }
        throw e2;
      }
    } catch (e1) {
      // serializer-init
      if (e1 !== dummy) {
        dispatchError(e1);
        error = e1;
        // e1 = dummy;
      }
      this.#cleanup();
      throw error;
    } finally {
      this.#vars.transition = null;
    }
  };

  #stop = async () => {
    const dispatchError = this.#dispatchError;

    if (!this.#vars.closed) {
      // send doesn't throw but dispatchError
      if (this.#vars.bye) busEvents.terminate(this.#sta.bus.shinka.dataEvent);

      try {
        await this.#transportCloseDelegate.call();
      } catch (e) {
        dispatchError(e);
      }
    }

    try {
      this.#serializerStopDelegate.call();
    } catch (e) {
      dispatchError(e);
    }

    try {
      this.#limonStopDelegate.call();
    } catch (e) {
      dispatchError(e);
    }

    try {
      this.#sta.nb.TA.lock.stop(this.#sta.nb.TA);
    } catch (e) {
      dispatchError(e);
    }

    try {
      this.#outscope.remove(this.#onOutScopeDelegate.call);
    } catch (e) {
      dispatchError(e);
    }

    this.#cleanup();
  };

  public restart = async () => {
    await this.stop(); // doesn't throw
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
      this.#dispatchError(e);
    }
  };

  #cleanup = () => {
    const dispatchError = this.#dispatchError;

    for (const cb of this.#resetStatesQueue)
      try {
        cb();
      } catch (e) {
        dispatchError(e);
      }

    this.#onOutScopeDelegate.reset();

    this.#sendDelegate.reset();
    this.#serializerStopDelegate.reset();
    this.#limonStopDelegate.reset();
    this.#transportCloseDelegate.reset();
    this.#vars.bye = 0;
    this.#lastDataAt.sent = 0;
    this.#lastDataAt.received = 0;

    this.#vars.state = BusState.STOPPED;

    this.#vars.transition = null;
    this.#callEventListeners("disconnected", null);
  };
}
