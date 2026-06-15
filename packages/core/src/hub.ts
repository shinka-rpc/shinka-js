import { ReusablePromise } from "@shinka-rpc/util";

import {
  defaultRequestTimeout,
  defaultExchangeTimeoutThrashold,
  defaultExchangeTimeout,
} from "./constants";

import { Bus } from "./bus";

import { createEventListeners } from "./factory/event-listeners-bus";

import type {
  ShinkaEventListeners,
  ManageEventListener,
  Factories,
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  InternalHandlerRegistries,
  HandlerRegistriesAll,
} from "./types";

import { createHandlerRegistries, type HandlerRegistries } from "./shinka";

type HubTimeoutSettings = {
  responseTimeout: number;
  exchangeTimeout: number;
  exchangeTimeoutThrashold: number;
};

export type HubOptions = Partial<HubTimeoutSettings>;

export type HandlerRegistriesHub<SO, TO> = {
  transport?: InternalHandlerRegistries<SO, TO, Bus<SO, TO>>;
  serializer?: InternalHandlerRegistries<SO, TO, Bus<SO, TO>>;
};

export type HubConnectProps<SO, TO> = {
  factories: Factories<SO, TO>;
  handlerRegistries: HandlerRegistriesHub<SO, TO>;
};

export class Hub<SO, TO> {
  private userRegistries!: HandlerRegistries<SO, TO, Bus<SO, TO>>;
  private eventListeners!: ShinkaEventListeners<Bus<SO, TO>>;
  private timeoutSettings!: HubTimeoutSettings;
  private clients!: Set<Bus<SO, TO>>;
  private disposing!: ReusablePromise<void>;

  public onRequest!: ShinkaOnRequest<SO, TO, Bus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<Bus<SO, TO>>;
  public extra!: Record<string | symbol, any>;

  constructor({
    responseTimeout = defaultRequestTimeout,
    exchangeTimeout = defaultExchangeTimeout,
    exchangeTimeoutThrashold = defaultExchangeTimeoutThrashold,
  }: HubOptions) {
    this.timeoutSettings = {
      responseTimeout,
      exchangeTimeout,
      exchangeTimeoutThrashold,
    };
    this.eventListeners = createEventListeners();
    this.userRegistries = createHandlerRegistries<SO, TO, Bus<SO, TO>>();
    this.clients = new Set<Bus<SO, TO>>();
    this.disposing = new ReusablePromise();
    this.extra = {};
    this.onRequest = this.userRegistries.onRequest;
    this.onDataEvent = this.userRegistries.onDataEvent;
    Object.freeze(this);
    this.disposing.resolve();
  }

  private onClientDisconnect = (bus: Bus<SO, TO>) => this.clients.delete(bus);

  public connect = async ({
    factories,
    handlerRegistries,
  }: HubConnectProps<SO, TO>) => {
    await this.disposing;

    const handlerRegistriesAll: HandlerRegistriesAll<SO, TO, Bus<SO, TO>> = {
      ...handlerRegistries,
      user: this.userRegistries,
    };

    const bus = new Bus<SO, TO>(
      factories as any,
      handlerRegistriesAll as any,
      this.eventListeners as any,
      this.timeoutSettings.responseTimeout,
      this.timeoutSettings.exchangeTimeout,
      this.timeoutSettings.exchangeTimeoutThrashold,
    );

    Object.freeze(bus);
    bus.addEventListener("disconnect", this.onClientDisconnect);
    this.clients.add(bus);
    await bus.start();

    return bus;
  };

  public dispose = async () => {
    this.disposing.reset();
    const clientStopPromises = Array<Promise<void>>(this.clients.size);
    let i = 0;
    for (const client of this.clients) clientStopPromises[i++] = client.stop();
    try {
      await Promise.all(clientStopPromises);
    } finally {
      this.disposing.resolve();
    }
  };

  public addEventListener: ManageEventListener<Bus<SO, TO>> = (type, target) =>
    this.eventListeners[type].add(target);

  public removeEventListener: ManageEventListener<Bus<SO, TO>> = (
    type,
    target,
  ) => this.eventListeners[type].delete(target);

  public get size() {
    return this.clients.size;
  }

  public get isDisposing() {
    return !this.disposing.isDone;
  }
}
