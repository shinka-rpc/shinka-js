import {
  defaultRequestTimeout,
  defaultExchangeTimeoutThrashold,
} from "./constants";

import { CommonBus } from "./common";

import { createEventListeners } from "./factory/event-listeners";

import type {
  ShinkaEventListeners,
  ManageEventListener,
  Factories,
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  InternalHandlerRegistries,
  ExchangeTimeouts,
  HandlerRegistriesAll,
} from "./types";

import { createHandlerRegistries, type HandlerRegistries } from "./shinka";

export type ServerOptions = {
  responseTimeout?: number;
  exchangeTimeouts?: ExchangeTimeouts;
};

export type HandlerRegistriesHub<SO, TO, B> = {
  transport?: InternalHandlerRegistries<SO, TO, B>;
  serializer?: InternalHandlerRegistries<SO, TO, B>;
};

export type ConnectProps<SO, TO, B> = {
  factories: Factories<SO, TO>;
  handlerRegistries: HandlerRegistriesHub<SO, TO, B>;
};

export class Hub<SO, TO> {
  private userRegistries!: HandlerRegistries<SO, TO, CommonBus<SO, TO>>;
  private eventListeners!: ShinkaEventListeners<CommonBus<SO, TO>>;
  private responseTimeout!: number;
  private exchangeTimeouts!: ExchangeTimeouts;

  public clients!: Set<CommonBus<SO, TO>>;
  public onRequest!: ShinkaOnRequest<SO, TO, CommonBus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<CommonBus<SO, TO>>;
  public extra!: Record<string | symbol, any>;

  constructor({
    responseTimeout = defaultRequestTimeout,
    exchangeTimeouts = {
      value: 0,
      thrashold: defaultExchangeTimeoutThrashold,
    },
  }: ServerOptions) {
    this.responseTimeout = responseTimeout;
    this.exchangeTimeouts = exchangeTimeouts;
    this.userRegistries = createHandlerRegistries<SO, TO, CommonBus<SO, TO>>();
    this.clients = new Set<CommonBus<SO, TO>>();
    this.eventListeners = createEventListeners();
    this.extra = {};
    this.onRequest = this.userRegistries.onRequest;
    this.onDataEvent = this.userRegistries.onDataEvent;
    Object.freeze(this);
  }

  private onClientDisconnect = (bus: CommonBus<SO, TO>) =>
    this.clients.delete(bus);

  public connect = async ({
    factories,
    handlerRegistries,
  }: ConnectProps<SO, TO, CommonBus<SO, TO>>) => {
    const handlerRegistriesAll: HandlerRegistriesAll<
      SO,
      TO,
      CommonBus<SO, TO>
    > = {
      ...handlerRegistries,
      user: this.userRegistries,
    };

    const bus = new CommonBus(
      factories,
      handlerRegistriesAll as any,
      this.eventListeners as any,
      this.responseTimeout,
      this.exchangeTimeouts,
    );

    Object.freeze(bus);
    bus.addEventListener("disconnect", this.onClientDisconnect);
    this.clients.add(bus);

    await bus.start();
    return bus;
  };

  public addEventListener: ManageEventListener<CommonBus<SO, TO>> = (
    type,
    target,
  ) => this.eventListeners[type].add(target);

  public removeEventListener: ManageEventListener<CommonBus<SO, TO>> = (
    type,
    target,
  ) => this.eventListeners[type].delete(target);
}
