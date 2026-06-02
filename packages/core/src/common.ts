import { createSendData, createOnRawData } from "./factory/serializer-strategy";

import { makeCreateOrCompleteShinka } from "./shinka";
import {
  busHandlerRegistries,
  exchangeTimeoutHandler,
  busEvents,
  busRequests,
} from "./bus-handler-registries";

import {
  messageTypeTransport,
  messageTypeSerializer,
  messageTypeBus,
  messageTypeUser,
  defaultRequestTimeout,
  defaultExchangeTimeoutThrashold,
  type MessageTypeGroup,
} from "./constants";

import { microTaskHelper } from "./microtask-helper";

import type {
  SendFn,
  DispatchMap,
  Message,
  AddRemoveEventListener,
  ShinkaEventListeners,
  ShinkaAll,
  ThisArgMap,
  HandlerRegistriesAll,
  InternalHandlerThisArg,
  Factories,
  VarsTimeout,
  ExchangeTimeouts,
  BusHandlerThisArg,
  ShinkaDataEvent,
  ShinkaRequest,
} from "./types";

import { delegate, type DelegateType, banshee } from "@shinka-rpc/util";

const transportNotInitialized = () => {
  throw new Error("Transport is not initialized");
};

const dummy = () => {};

const thisArgMapHelper = <SO, TO, B>(
  thisArgMap: ThisArgMap<SO, TO, B>,
  messageTypeGroup: MessageTypeGroup,
  thisArg: InternalHandlerThisArg<SO, TO, B> | BusHandlerThisArg<SO, TO, B> | B,
) => {
  for (const i of messageTypeGroup) thisArgMap.set(i, thisArg);
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

type GracefulShutdownThis = [
  ShinkaDataEvent<any, any>,
  () => void,
  () => Promise<void>,
];

function gracefulShutdown(this: GracefulShutdownThis) {
  busEvents.terminate(this[0]);
  this[1]();
  this[2]();
}

type CommonBusVars = VarsTimeout &
  VarsBye & {
    state: BusState;
  };

export class CommonBus<SO, TO> {
  private factories!: Factories<SO, TO>;
  private shinkaAll!: ShinkaAll<SO, TO, typeof this>;
  private dispatchMap!: DispatchMap<
    InternalHandlerThisArg<SO, TO, typeof this> | typeof this
  >;
  private thisArgMap!: ThisArgMap<SO, TO, typeof this>;
  private sendDelegate!: DelegateType<SendFn<SO, TO>>;
  private closeDelegate!: DelegateType<() => Promise<void>>;
  private clenaupDelegate!: DelegateType<(callOnWail?: boolean) => void>;
  private eventListeners!: ShinkaEventListeners<typeof this>;
  private vars!: CommonBusVars;
  private exchangeTimeouts!: ExchangeTimeouts;

  public request!: ShinkaRequest<SO, TO>;
  public dataEvent!: ShinkaDataEvent<SO, TO>;
  public extra!: Record<string | symbol, any>;

  constructor(
    factories: Factories<SO, TO>,
    handlerRegistries: HandlerRegistriesAll<SO, TO, typeof this>,
    eventListeners: ShinkaEventListeners<typeof this>,
    responseTimeout = defaultRequestTimeout,
    exchangeTimeouts: ExchangeTimeouts = {
      value: 0,
      thrashold: defaultExchangeTimeoutThrashold,
    },
  ) {
    this.factories = factories;
    this.eventListeners = eventListeners;
    this.exchangeTimeouts = exchangeTimeouts;
    this.dispatchMap = new Map();
    this.thisArgMap = new Map();

    this.vars = {
      state: BusState.STOPPED,
      lastReceivedAt: 0,
      lastSendAt: 0,
      externalTimeout: 0,
      exchangeTimeoutId: null,
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

    thisArgMapHelper(this.thisArgMap, messageTypeBus, {
      bus: this,
      shinka: this.shinkaAll.bus,
      vars: this.vars,
      exchangeTimeouts: exchangeTimeouts,
    });

    thisArgMapHelper(this.thisArgMap, messageTypeSerializer, {
      bus: this,
      shinka: this.shinkaAll.serializer,
    });

    thisArgMapHelper(this.thisArgMap, messageTypeTransport, {
      bus: this,
      shinka: this.shinkaAll.transport,
    });

    thisArgMapHelper(this.thisArgMap, messageTypeUser, this);

    this.request = this.shinkaAll.user.request;
    this.dataEvent = this.shinkaAll.user.dataEvent;

    this.extra = {};
  }

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

      const {
        send: sendSerialized,
        close,
        instruction,
        onReady: onReadyTransport,
      } = await this.factories.transport(onRawData, transportInitOpts);

      this.closeDelegate.set(close);

      const send = createSendData(
        typeHints.serialize,
        serialize,
        sendSerialized,
        this.vars,
      );

      this.sendDelegate.set(send);

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

      if (this.exchangeTimeouts.value)
        this.vars.exchangeTimeoutId = setTimeout(
          exchangeTimeoutHandler,
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
        ? gracefulShutdown.bind([
            this.shinkaAll.bus.dataEvent,
            byeReset.bind(this.vars),
            this.stop,
          ])
        : this.stop;

      this.clenaupDelegate.set(banshee(this, wail));

      this.vars.state = BusState.STARTED;

      for (const listener of this.eventListeners.connect)
        // @ts-expect-error: 2769
        queueMicrotask(microTaskHelper.bind([listener, this]));
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

    for (const listener of this.eventListeners.disconnect)
      // @ts-expect-error: 2769
      queueMicrotask(microTaskHelper.bind([listener, this]));

    try {
      await this.closeDelegate.call();
    } catch (e) {
      console.error(e);
    }

    this.clenaup();
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

  public addEventListener: AddRemoveEventListener<this> = (type, target) =>
    this.eventListeners[type].add(target);

  public removeEventListener: AddRemoveEventListener<this> = (type, target) =>
    this.eventListeners[type].delete(target);

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

    if (this.vars.exchangeTimeoutId !== null) {
      clearTimeout(this.vars.exchangeTimeoutId);
      this.vars.exchangeTimeoutId = null;
    }

    this.vars.state = BusState.STOPPED;
  };
}
