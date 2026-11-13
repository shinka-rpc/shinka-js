import { Bus } from "./bus";
import { createHandlerRegistries, type HandlerRegistries } from "./shinka";

import { createEventListeners } from "./listeners/event-listeners-bus";

import type { ShinkaEventListeners, IBus, BusProps } from "./types";
import type { ManageEventListener } from "./listeners/types";
import type { ShinkaOnRequest, ShinkaOnDataEvent } from "./shinka";

const { freeze: objectFreeze } = Object;

export class Hub<SO = any, TO = any, TC = any> {
  #userRegistries: HandlerRegistries<SO, TO, IBus<SO, TO>>;
  #eventListeners: ShinkaEventListeners<IBus<SO, TO>>;
  #clientsAlive: Set<Bus<SO, TO, TC>>;
  #bound: [
    (bus: Bus<SO, TO, TC>) => void,
    (bus: Bus<SO, TO, TC>) => void,
    (bus: Bus<SO, TO, TC>) => void,
  ];

  public has: (bus: Bus<SO, TO, TC>) => boolean;
  public onRequest: ShinkaOnRequest<SO, TO, IBus<SO, TO>>;
  public onDataEvent: ShinkaOnDataEvent<IBus<SO, TO>>;
  public extra: Record<string | symbol, any>;

  constructor(eventListeners?: ShinkaEventListeners<IBus<SO, TO>>) {
    this.#eventListeners = eventListeners ?? createEventListeners();
    this.#userRegistries = createHandlerRegistries<SO, TO, IBus<SO, TO>>();
    const clients = new Set<Bus<SO, TO, TC>>();
    this.#clientsAlive = clients;
    const clientsAll = new WeakSet<Bus<SO, TO, TC>>();
    this.has = clientsAll.has.bind(clientsAll);
    this.#bound = [
      clients.add.bind(clients),
      clients.delete.bind(clients),
      clientsAll.add.bind(clientsAll),
    ];
    this.extra = {};
    this.onRequest = this.#userRegistries.onRequest;
    this.onDataEvent = this.#userRegistries.onDataEvent;
    objectFreeze(this);
  }

  public create = ({
    outscope,
    transport,
    lock,
    serializer,
    limon = null,
    responseTimeout,
    complete,
  }: BusProps<SO, TO, TC>) => {
    const { 0: boundAdd, 1: boundRm, 2: boundAllAdd } = this.#bound,
      bus = new Bus<SO, TO, TC>(
        outscope,
        transport,
        serializer,
        limon,
        this.#userRegistries,
        this.#eventListeners,
        lock,
        responseTimeout,
        complete,
      ),
      busAddEventListener = bus.addEventListener;

    objectFreeze(bus);

    boundAllAdd(bus);

    busAddEventListener("connecting", boundAdd);
    busAddEventListener("connected", boundAdd);
    busAddEventListener("disconnecting", boundRm);
    busAddEventListener("disconnected", boundRm);

    return bus;
  };

  public dispose = () =>
    Promise.all([...this.#clientsAlive].map((client) => client.stop()));

  public addEventListener: ManageEventListener<IBus<SO, TO>> = (type, target) =>
    this.#eventListeners[type].add(target);

  public removeEventListener: ManageEventListener<IBus<SO, TO>> = (
    type,
    target,
  ) => this.#eventListeners[type].delete(target);

  public get size() {
    return this.#clientsAlive.size;
  }
}
