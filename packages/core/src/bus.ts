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
} from "./factory/event-listeners-bus";

import {
  messageTypeTransport,
  messageTypeSerializer,
  messageTypeBus,
  messageTypeUser,
  defaultRequestTimeout,
  defaultExchangeTimeout,
  defaultExchangeTimeoutThrashold,
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
  bus: BusHandlerThisArg<SO, TO, TA>;
  serializer: InternalHandlerThisArg<SO, TO, TA>;
  transport: InternalHandlerThisArg<SO, TO, TA>;
};

type DispatchErrors = {
  send: (error: any) => void;
  recv: (error: any) => void;
};

export class Bus<SO, TO> {
  private factories!: FactoriesGeneric<
    SO,
    TO,
    InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
  >;
  private shinkaAll!: ShinkaAll<SO, TO, Bus<SO, TO>>;
  private dispatchMap!: DispatchMap;
  private thisArgInternal!: ThisArgInternal<SO, TO, Bus<SO, TO>>;
  private sendDelegate!: DelegateType<SendFn<SO, TO>>;
  private closeDelegate!: DelegateType<() => Promise<void>>;
  private cleanupDelegate!: DelegateType<(callOnWail?: boolean) => void>;
  private eventListeners!: ShinkaListenerLayers<typeof this>;
  private vars!: BusVars;
  private exchangeTimeouts!: ExchangeTimeouts;
  private dispatchErrors!: DispatchErrors;
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
    exchangeTimeout = defaultExchangeTimeout,
    exchangeTimeoutThrashold = defaultExchangeTimeoutThrashold,
  ) {
    this.factories = factories;
    this.eventListeners = {
      own: createEventListeners(),
      parent: eventListeners,
      banned: createEventListenersBanned(),
    };
    this.exchangeTimeouts = {
      value: exchangeTimeout,
      thrashold: exchangeTimeoutThrashold,
    };
    this.dispatchMap = new Map();

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
    this.cleanupDelegate = delegate(dummy);

    this.dispatchErrors = {
      send: (error) =>
        this.callEventListeners("error", {
          message: "Failed to send data",
          error,
        }),
      recv: (error) =>
        this.callEventListeners("error", {
          message: "Failed to handle received data",
          error,
        }),
    };

    const dispatchError = (error: any) =>
      this.callEventListeners("error", error);

    const createOrCompleteShinka = makeCreateOrCompleteShinka<SO, TO, any>(
      this.sendDelegate.call,
      this.dispatchMap,
      responseTimeout,
    );

    const [busSetVars, busShinka] = createOrCompleteShinka(
      messageTypeBus,
      busHandlerRegistries,
    );

    const [serializerSetVars, serializerShinka] = createOrCompleteShinka(
      messageTypeSerializer,
      handlerRegistries.serializer,
    );

    const [transportSetVars, transportShinka] = createOrCompleteShinka(
      messageTypeTransport,
      handlerRegistries.transport,
    );

    const [userSetVars, userShinka] = createOrCompleteShinka(
      messageTypeUser,
      handlerRegistries.user,
    );

    this.shinkaAll = {
      bus: busShinka,
      serializer: serializerShinka,
      transport: transportShinka,
      user: userShinka,
    };

    const busTA: BusHandlerThisArg<SO, TO, Bus<SO, TO>> = Object.freeze({
      bus: this,
      shinka: busShinka,
      vars: this.vars,
      exchangeTimeouts: this.exchangeTimeouts,
    });

    const serializerTA: InternalHandlerThisArg<
      SO,
      TO,
      Bus<SO, TO>
    > = Object.freeze({ bus: this, shinka: serializerShinka });

    const transportrTA: InternalHandlerThisArg<
      SO,
      TO,
      Bus<SO, TO>
    > = Object.freeze({ bus: this, shinka: transportShinka });

    this.thisArgInternal = {
      bus: busTA,
      serializer: serializerTA as InternalHandlerThisArg<SO, TO, this>,
      transport: transportrTA as InternalHandlerThisArg<SO, TO, this>,
    };

    busSetVars(busTA, dispatchError);
    serializerSetVars(serializerTA, dispatchError);
    transportSetVars(transportrTA, dispatchError);
    userSetVars(this, dispatchError);

    this.onTerminated = onTerminated.bind([
      this.vars,
      this.closeDelegate.reset,
      this.stop,
    ]);

    this.request = this.shinkaAll.user.request;
    this.dataEvent = this.shinkaAll.user.dataEvent;

    this.extra = {};
  }

  private callEventListeners = (type: EventListenerType, target: any) => {
    const own = this.eventListeners.own[type];
    for (const listener of own)
      // @ts-expect-error: 2769
      queueMicrotask(microTaskHelper.bind([listener, this, target]));

    const banned = this.eventListeners.banned[type];
    for (const listener of this.eventListeners.parent[type])
      if (!(banned.has(listener) || own.has(listener)))
        // @ts-expect-error: 2769
        queueMicrotask(microTaskHelper.bind([listener, this, target]));
  };

  public start = async () => {
    if (this.vars.state === BusState.STARTED) return;
    if (this.vars.state !== BusState.STOPPED)
      return this.callEventListeners("error", {
        message: "Bus is not in `STOPPED` state",
        when: "start",
      });

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
        this.dispatchErrors.recv,
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
        this.dispatchErrors.send,
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

      this.cleanupDelegate.set(banshee(this, wail));
      this.vars.state = BusState.STARTED;
      this.callEventListeners("connect", null);
    } catch (e) {
      try {
        await this.closeDelegate.call();
      } catch (e) {
        this.callEventListeners("error", e);
      }
      this.cleanup();
      throw e;
    }
  };

  public stop = async () => {
    if (this.vars.state === BusState.STOPPED) return;
    if (this.vars.state !== BusState.STARTED)
      return this.callEventListeners("error", {
        message: "Bus is not in `STARTED` state",
        when: "stop",
      });

    this.vars.state = BusState.STOPPING;

    if (this.vars.bye) busEvents.terminate(this.shinkaAll.bus.dataEvent);

    try {
      await this.closeDelegate.call();
    } catch (e) {
      this.callEventListeners("error", e);
    }

    this.cleanup();

    this.callEventListeners("disconnect", null);
  };

  public restart = async () => {
    try {
      await this.stop();
    } catch (e) {
      this.callEventListeners("error", e);
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
    try {
      const messageType = message[0];
      const dispatchHandler = this.dispatchMap.get(messageType);

      if (!dispatchHandler)
        throw { message: "Unknown message type", messageType };

      dispatchHandler(message as any);
    } catch (e) {
      this.callEventListeners("error", e);
    }
  };

  private cleanup = () => {
    this.cleanupDelegate.call(false);
    this.sendDelegate.reset();
    this.closeDelegate.reset();
    this.cleanupDelegate.reset();
    this.vars.bye = 0;

    if (this.vars.schedulerTimeoutId !== null) {
      clearTimeout(this.vars.schedulerTimeoutId);
      this.vars.schedulerTimeoutId = null;
    }

    this.vars.state = BusState.STOPPED;
  };
}
