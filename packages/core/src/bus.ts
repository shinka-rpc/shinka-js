import { delegate, type DelegateType, banshee } from "@shinka-rpc/util";

import { createSendData, createOnRawData } from "./factory/serializer-strategy";
import { makeCreateOrCompleteShinka } from "./shinka";
import { busEvents, busRequests } from "./bus-handler/do";
import { busHandlerRegistries } from "./bus-handler/on";
import { scheduler } from "./scheduler";
import { microTaskHelper } from "./microtask-helper";

import {
  createEventListeners,
  createEventListenersBanned,
} from "./factory/event-listeners";

import {
  messageTypeTransport,
  messageTypeSerializer,
  messageTypeBus,
  messageTypeUser,
  defaultRequestTimeout,
  defaultExchangeTimeoutThrashold,
  type MessageTypeGroup,
} from "./constants";

import type {
  SendFn,
  DispatchMap,
  Message,
  ManageEventListener,
  EventListenerType,
  ShinkaEventListeners,
  ShinkaListenerLayers,
  ShinkaAll,
  ThisArgMap,
  HandlerRegistriesAll,
  InternalHandlerThisArg,
  FactoriesGeneric,
  VarsTimeout,
  ExchangeTimeouts,
  BusHandlerThisArg,
  ShinkaDataEvent,
  ShinkaRequest,
} from "./types";

const transportNotInitialized = () => {
  throw new Error("Transport is not initialized");
};

const dummy = () => {};

const thisArgMapHelper = <SO, TO, B>(
  thisArgMap: ThisArgMap<SO, TO, B>,
  messageTypeGroup: MessageTypeGroup,
  freeze: 0 | 1,
  thisArg: InternalHandlerThisArg<SO, TO, B> | BusHandlerThisArg<SO, TO, B> | B,
) => {
  if (freeze) Object.freeze(thisArg);
  for (const i of messageTypeGroup) thisArgMap.set(i, thisArg);
  return thisArg;
};

const enum BusState {
  STOPPED = 0,
  STARTING = 1,
  STARTED = 2,
  STOPPING = 3,
}

type VarsBye = {
  bye: 0 | 1;
};

function byeReset(this: VarsBye) {
  this.bye = 0;
}

type GracefulShutdownThis = readonly [
  ShinkaDataEvent<any, any>,
  () => void,
  () => Promise<void>,
];

function gracefulShutdown(this: GracefulShutdownThis) {
  busEvents.terminate(this[0]);
  this[1]();
  this[2]();
}

type OnTerminateThis = readonly [VarsBye, () => void, () => void];

function onTerminated(this: OnTerminateThis) {
  this[0].bye = 0;
  this[1]();
  this[2]();
}

type BusVars = VarsTimeout &
  VarsBye & {
    state: BusState;
  };

type ThisArgInternal<SO, TO, TA> = {
  serializer: InternalHandlerThisArg<SO, TO, TA>;
  transport: InternalHandlerThisArg<SO, TO, TA>;
};

export class Bus<SO, TO> {
  private factories!: FactoriesGeneric<
    SO,
    TO,
    InternalHandlerThisArg<SO, TO, typeof this>
  >;
  private shinkaAll!: ShinkaAll<SO, TO, typeof this>;
  private dispatchMap!: DispatchMap<
    InternalHandlerThisArg<SO, TO, typeof this> | typeof this
  >;
  private thisArgMap!: ThisArgMap<SO, TO, typeof this>;
  private thisArgInternal!: ThisArgInternal<SO, TO, typeof this>;
  private sendDelegate!: DelegateType<SendFn<SO, TO>>;
  private closeDelegate!: DelegateType<() => Promise<void>>;
  private clenaupDelegate!: DelegateType<(callOnWail?: boolean) => void>;
  private eventListeners!: ShinkaListenerLayers<typeof this>;
  private vars!: BusVars;
  private exchangeTimeouts!: ExchangeTimeouts;
  private onTerminated!: () => void;

  public request!: ShinkaRequest<SO, TO>;
  public dataEvent!: ShinkaDataEvent<SO, TO>;
  public extra!: Record<string | symbol, any>;

  constructor(
    factories: FactoriesGeneric<
      SO,
      TO,
      InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
    >,
    handlerRegistries: HandlerRegistriesAll<SO, TO, Bus<SO, TO>>,
    eventListeners: ShinkaEventListeners<Bus<SO, TO>>,
    responseTimeout = defaultRequestTimeout,
    exchangeTimeouts: ExchangeTimeouts = {
      value: 0,
      thrashold: defaultExchangeTimeoutThrashold,
    },
  ) {
    this.factories = factories;
    this.eventListeners = {
      own: createEventListeners(),
      parent: eventListeners,
      banned: createEventListenersBanned(),
    };
    this.exchangeTimeouts = exchangeTimeouts;
    this.dispatchMap = new Map();
    this.thisArgMap = new Map();

    this.vars = {
      state: BusState.STOPPED,
      lastReceivedAt: 0,
      lastSendAt: 0,
      externalTimeout: 0,
      schedulerTimeoutId: null,
      bye: 0,
    };

    this.sendDelegate = delegate(transportNotInitialized as SendFn<any, any>);
    this.closeDelegate = delegate(
      transportNotInitialized as () => Promise<void>,
    );
    this.clenaupDelegate = delegate(dummy);

    const createOrCompleteShinka = makeCreateOrCompleteShinka<SO, TO, any>(
      this.sendDelegate.call,
      this.dispatchMap,
      responseTimeout,
    );

    this.shinkaAll = {
      bus: createOrCompleteShinka(messageTypeBus, busHandlerRegistries),
      serializer: createOrCompleteShinka(
        messageTypeSerializer,
        handlerRegistries.serializer,
      ),
      transport: createOrCompleteShinka(
        messageTypeTransport,
        handlerRegistries.transport,
      ),
      user: createOrCompleteShinka(messageTypeUser, handlerRegistries.user),
    };

    thisArgMapHelper(this.thisArgMap, messageTypeBus, 1, {
      bus: this,
      shinka: this.shinkaAll.bus,
      vars: this.vars,
      exchangeTimeouts: exchangeTimeouts,
    });

    const serializerTA = thisArgMapHelper(
      this.thisArgMap,
      messageTypeSerializer,
      1,
      {
        bus: this,
        shinka: this.shinkaAll.serializer,
      },
    );

    const transportrTA = thisArgMapHelper(
      this.thisArgMap,
      messageTypeTransport,
      1,
      {
        bus: this,
        shinka: this.shinkaAll.transport,
      },
    );

    this.thisArgInternal = {
      serializer: serializerTA as InternalHandlerThisArg<SO, TO, this>,
      transport: transportrTA as InternalHandlerThisArg<SO, TO, this>,
    };

    thisArgMapHelper(this.thisArgMap, messageTypeUser, 0, this);

    this.onTerminated = onTerminated.bind([
      this.vars,
      this.closeDelegate.reset,
      this.stop,
    ]);

    this.request = this.shinkaAll.user.request;
    this.dataEvent = this.shinkaAll.user.dataEvent;

    this.extra = {};
  }

  private callEventListeners = (type: EventListenerType) => {
    const own = this.eventListeners.own[type];
    for (const listener of own)
      // @ts-expect-error: 2769
      queueMicrotask(microTaskHelper.bind([listener, this]));

    const banned = this.eventListeners.banned[type];
    for (const listener of this.eventListeners.parent[type])
      if (!(banned.has(listener) || own.has(listener)))
        // @ts-expect-error: 2769
        queueMicrotask(microTaskHelper.bind([listener, this]));
  };

  public start = async () => {
    if (this.vars.state === BusState.STARTED) return;
    if (this.vars.state !== BusState.STOPPED)
      return console.warn("Bus is not in `STOPPED` state");

    try {
      this.vars.state = BusState.STARTING;

      const maybeSerializerInstance = this.factories.serializer();
      const {
        serialize,
        deserialize,
        onReady: onReadySerializer,
        transportInitOpts,
        typeHints,
      } = maybeSerializerInstance instanceof Promise
        ? await maybeSerializerInstance
        : maybeSerializerInstance;

      const onRawData = createOnRawData(
        typeHints.deserialize,
        deserialize,
        this.dispatch,
        this.vars,
      );

      const maybeTransportInstance = this.factories.transport(
        onRawData,
        this.onTerminated,
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

      this.closeDelegate.set(close);

      const send = createSendData(
        typeHints.serialize,
        serialize,
        sendSerialized,
        this.vars,
      );

      this.sendDelegate.set(send);

      if (onReadyTransport) {
        const onReadyTransportPromise = onReadyTransport(
          this.thisArgInternal.transport,
        );
        if (onReadyTransportPromise instanceof Promise)
          await onReadyTransportPromise;
      }
      if (onReadySerializer) {
        const onReadySerializerPromise = onReadySerializer(
          this.thisArgInternal.serializer,
        );
        if (onReadySerializerPromise instanceof Promise)
          await onReadySerializerPromise;
      }

      if (this.exchangeTimeouts.value)
        this.vars.schedulerTimeoutId = setTimeout(
          scheduler,
          this.exchangeTimeouts.value,
          this,
          this.shinkaAll.bus,
          this.vars,
          this.exchangeTimeouts,
        );

      if (this.exchangeTimeouts.value)
        busEvents.exchange(
          this.shinkaAll.bus.dataEvent,
          this.exchangeTimeouts.value,
        );
      else if (instruction.hi && !this.vars.lastSendAt)
        busEvents.iAmAlive(this.shinkaAll.bus.dataEvent);

      if (instruction.bye) this.vars.bye = 1;
      const wail = instruction.bye
        ? gracefulShutdown.bind(
            Object.freeze([
              this.shinkaAll.bus.dataEvent,
              byeReset.bind(this.vars),
              this.stop,
            ]),
          )
        : this.stop;

      this.clenaupDelegate.set(banshee(this, wail));
      this.vars.state = BusState.STARTED;
      this.callEventListeners("connect");
    } catch (e) {
      try {
        await this.closeDelegate.call();
      } catch (e) {}
      this.clenaup();
      throw e;
    }
  };

  public stop = async () => {
    if (this.vars.state === BusState.STOPPED) return;
    if (this.vars.state !== BusState.STARTED)
      return console.warn("Bus is not in `STARTED` state");

    this.vars.state = BusState.STOPPING;

    if (this.vars.bye) busEvents.terminate(this.shinkaAll.bus.dataEvent);

    try {
      await this.closeDelegate.call();
    } catch (e) {
      console.error(e);
    }

    this.clenaup();

    this.callEventListeners("disconnect");
  };

  public restart = async () => {
    try {
      await this.stop();
    } catch (e) {
      console.warn(e);
    }
    await this.start();
  };

  public ping = async () => {
    const begin = performance.now();
    await busRequests.ping(this.shinkaAll.bus.request);
    return performance.now() - begin;
  };

  public addEventListener: ManageEventListener<this> = (type, target) => {
    this.eventListeners.banned[type].delete(target);
    this.eventListeners.own[type].add(target);
  };

  public removeEventListener: ManageEventListener<this> = (type, target) => {
    this.eventListeners.banned[type].add(target);
    this.eventListeners.own[type].delete(target);
  };

  private dispatch = (message: Message<any>) => {
    const messageType = message[0];
    const dispatchHandler = this.dispatchMap.get(messageType);
    if (!dispatchHandler) return console.error("Unknown message type");
    const thisArg = this.thisArgMap.get(messageType)!;
    dispatchHandler(message as any, thisArg);
  };

  private clenaup = () => {
    this.clenaupDelegate.call(false);
    this.sendDelegate.reset();
    this.closeDelegate.reset();
    this.clenaupDelegate.reset();
    this.vars.bye = 0;

    if (this.vars.schedulerTimeoutId !== null) {
      clearTimeout(this.vars.schedulerTimeoutId);
      this.vars.schedulerTimeoutId = null;
    }

    this.vars.state = BusState.STOPPED;
  };
}
