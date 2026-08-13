import { ReusablePromise } from "@shinka-rpc/concurrency";
import type { OutScope } from "@shinka-rpc/outscope";

import { defaultRequestTimeout, defaultExclusiveLock } from "./defaults";

import { Bus } from "./bus";
import { createHandlerRegistries, type HandlerRegistries } from "./shinka";

import { createEventListeners } from "./factory/event-listeners-bus";

import type {
  ShinkaEventListeners,
  ManageEventListener,
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  TransportRF,
  SerializerRF,
  LiMonRF,
  ExclusiveLock,
} from "./types";

const { freeze: objectFreeze } = Object;

type HubTimeoutSettings = {
  responseTimeout: number;
};

export type HubOptions<SO, TO> = Partial<HubTimeoutSettings> & {
  outscope: OutScope;
  limon?: LiMonRF<SO, TO, any> | null;
  lock?: ExclusiveLock<SO, TO, any>;
};

export type HubConnectProps<SO, TO> = {
  transport: TransportRF<SO, TO, any>;
  serializer: SerializerRF<SO, TO, any>;
};

export class Hub<SO, TO> {
  #outscope!: OutScope;
  #limonRF!: LiMonRF<SO, TO, any> | null;
  #lock!: ExclusiveLock<SO, TO, any>;
  #userRegistries!: HandlerRegistries<SO, TO, Bus<SO, TO>>;
  #eventListeners!: ShinkaEventListeners<Bus<SO, TO>>;
  #timeoutSettings!: HubTimeoutSettings;
  #clients!: Set<Bus<SO, TO>>;
  #disposing!: ReusablePromise<void>;

  public onRequest!: ShinkaOnRequest<SO, TO, Bus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<Bus<SO, TO>>;
  public extra!: Record<string | symbol, any>;

  constructor({
    outscope,
    responseTimeout = defaultRequestTimeout,
    limon = null,
    lock = defaultExclusiveLock,
  }: HubOptions<SO, TO>) {
    this.#outscope = outscope;
    this.#limonRF = limon;
    this.#lock = lock;
    this.#timeoutSettings = {
      responseTimeout,
    };
    this.#eventListeners = createEventListeners();
    this.#userRegistries = createHandlerRegistries<SO, TO, Bus<SO, TO>>();
    this.#clients = new Set<Bus<SO, TO>>();
    this.#disposing = new ReusablePromise();
    this.extra = {};
    this.onRequest = this.#userRegistries.onRequest;
    this.onDataEvent = this.#userRegistries.onDataEvent;
    objectFreeze(this);
    this.#disposing.resolve();
  }

  #onClientDisconnect = (bus: Bus<SO, TO>) => this.#clients.delete(bus);

  public connect = async ({
    transport,
    serializer,
  }: HubConnectProps<SO, TO>) => {
    await this.#disposing;

    const bus = new Bus<SO, TO>(
      this.#outscope,
      transport,
      serializer,
      this.#limonRF,
      this.#userRegistries,
      this.#eventListeners,
      this.#lock,
      this.#timeoutSettings.responseTimeout,
    );

    objectFreeze(bus);
    bus.addEventListener("disconnect", this.#onClientDisconnect);
    this.#clients.add(bus);
    await bus.start();

    return bus;
  };

  public dispose = async () => {
    this.#disposing.reset();
    const clientStopPromises = Array<Promise<void>>(this.#clients.size);
    let i = 0;
    for (const client of this.#clients) clientStopPromises[i++] = client.stop();
    try {
      await Promise.all(clientStopPromises);
    } finally {
      this.#disposing.resolve();
    }
  };

  public addEventListener: ManageEventListener<Bus<SO, TO>> = (type, target) =>
    this.#eventListeners[type].add(target);

  public removeEventListener: ManageEventListener<Bus<SO, TO>> = (
    type,
    target,
  ) => this.#eventListeners[type].delete(target);

  public get size() {
    return this.#clients.size;
  }

  public get isDisposing() {
    return !this.#disposing.isDone;
  }
}
