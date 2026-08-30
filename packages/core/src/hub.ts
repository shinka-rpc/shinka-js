import { ReusablePromise } from "@shinka-rpc/concurrency";

import { Bus } from "./bus";
import { createHandlerRegistries, type HandlerRegistries } from "./shinka";

import { createEventListeners } from "./factory/event-listeners-bus";

import type {
  ShinkaEventListeners,
  ManageEventListener,
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  IBus,
  BusProps,
} from "./types";

const { freeze: objectFreeze } = Object;

export class Hub<SO, TO, TC> {
  #userRegistries!: HandlerRegistries<SO, TO, IBus<SO, TO>>;
  #eventListeners!: ShinkaEventListeners<IBus<SO, TO>>;
  #clients!: Set<Bus<SO, TO, TC>>;
  #disposing!: ReusablePromise<void>;

  public onRequest!: ShinkaOnRequest<SO, TO, IBus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<IBus<SO, TO>>;
  public extra!: Record<string | symbol, any>;

  constructor() {
    this.#eventListeners = createEventListeners();
    this.#userRegistries = createHandlerRegistries<SO, TO, IBus<SO, TO>>();
    this.#clients = new Set<Bus<SO, TO, TC>>();
    this.#disposing = new ReusablePromise();
    this.extra = {};
    this.onRequest = this.#userRegistries.onRequest;
    this.onDataEvent = this.#userRegistries.onDataEvent;
    objectFreeze(this);
    this.#disposing.resolve();
  }

  #onClientDisconnect = (bus: Bus<SO, TO, TC>) => this.#clients.delete(bus);

  public connect = async ({
    outscope,
    transport,
    lock,
    serializer,
    limon = null,
    responseTimeout,
    complete,
  }: BusProps<SO, TO, TC>) => {
    await this.#disposing;

    const bus = new Bus<SO, TO, TC>(
      outscope,
      transport,
      serializer,
      limon,
      this.#userRegistries,
      this.#eventListeners,
      lock,
      responseTimeout,
      complete,
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

  public addEventListener: ManageEventListener<IBus<SO, TO>> = (type, target) =>
    this.#eventListeners[type].add(target);

  public removeEventListener: ManageEventListener<IBus<SO, TO>> = (
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
