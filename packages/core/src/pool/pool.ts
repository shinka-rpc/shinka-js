import type { IBus, ClientProps, BusProps } from "../types";
import type { ManageEventListener } from "../listeners/types";
import type { ShinkaOn, ShinkaOnRequest, ShinkaOnDataEvent } from "../shinka";
import { Hub } from "../hub";
import { defaultSerializerRoot } from "../defaults";
import { setupHandlerRegistries } from "../shinka";
import { BusProxy } from "./bus-proxy";
import { busProxyFR, PoolExtraSym } from "./const";
import type { AbstractScheduler, IScheduler, PoolEntry } from "./types";

const enum ENTRY {
  EXTRA = 0,
  BUS = 1,
  BROKEN_SET = 2,
  DISPOSE = 3,
  QUEUED = 4,
  ACQUIRED = 5,
}

export type PoolProps<SO, TO, TC> = ClientProps<SO, TO, TC> & {
  scheduler: AbstractScheduler<any>; // any is used for practical reason
};

type PoolVars = {
  actualSize: number;
  targetSize: number;
  acquired: number;
};

const { freeze: objectFreeze, defineProperties: objectDefineProperties } =
  Object;

const reconnectImmediately = (bus: IBus<any, any>) => bus.start().catch();

const makeEntry = <SO, TO>(
  vars: PoolVars,
  brokenMap: Map<IBus<SO, TO>, PoolEntry<SO, TO>>,
  scheduler: IScheduler<SO, TO, any>,
  bus: IBus<SO, TO>,
) => {
  const entry: PoolEntry<SO, TO> = [
    scheduler[PoolExtraSym]?.(),
    bus,
    (bus: IBus<SO, TO>) => brokenMap.set(bus, entry),
    null as any,
    0,
    0,
  ];
  const dispose = () => {
    entry[ENTRY.ACQUIRED] = 0;
    vars.acquired--;
    if (!bus.alive) return;
    entry[ENTRY.QUEUED] = 1;
    scheduler.push(entry);
  };
  entry[ENTRY.DISPOSE] = dispose;
  return entry;
};

const onReady =
  <SO, TO>(
    brokenMap: Map<IBus<SO, TO>, PoolEntry<SO, TO>>,
    scheduler: IScheduler<SO, TO, any>,
  ) =>
  (bus: IBus<SO, TO>) => {
    const entry = brokenMap.get(bus)!;
    if (!entry[ENTRY.ACQUIRED] && !entry[ENTRY.QUEUED]) {
      entry[ENTRY.QUEUED] = 1;
      scheduler.push(entry);
    }
    brokenMap.delete(bus);
  };

type OnBusReady<SO, TO> = ReturnType<typeof onReady<SO, TO>>;

export type PoolSize = {
  target: number; // set by user
  ready: number; // how many buses are able to be acquired
  actual: number; // transitional, tends to target
  acquired: number;
};

export class Pool<SO = any, TO = any, TC = any> implements ShinkaOn<
  SO,
  TO,
  IBus<SO, TO>
> {
  #hub: Hub<SO, TO, TC>;
  #connectProps: BusProps<SO, TO, TC>;
  #scheduler: IScheduler<SO, TO, any>;
  #brokenMap: Map<IBus<SO, TO>, PoolEntry<SO, TO>>; // except STARTED
  #onBusReady: OnBusReady<SO, TO>;
  #vars: PoolVars;
  #makeEntry: (bus: IBus<SO, TO>) => PoolEntry<SO, TO, any>;

  public onRequest: ShinkaOnRequest<SO, TO, IBus<SO, TO>>;
  public onDataEvent: ShinkaOnDataEvent<IBus<SO, TO>>;
  public addEventListener: ManageEventListener<IBus<SO, TO>>;
  public removeEventListener: ManageEventListener<IBus<SO, TO>>;
  public size: PoolSize;

  public extra: Record<string | symbol, any>;

  constructor({
    outscope,
    transport,
    scheduler,
    serializer = defaultSerializerRoot,
    limon = null,
    lock,
    responseTimeout,
    complete,
  }: PoolProps<SO, TO, TC>) {
    this.#hub = new Hub();
    this.#scheduler = scheduler;
    const brokenMap = new Map<IBus<SO, TO>, PoolEntry<SO, TO>>();
    const vars: PoolVars = { actualSize: 0, targetSize: 0, acquired: 0 };
    this.#onBusReady = onReady(brokenMap, scheduler);
    this.#brokenMap = brokenMap;
    this.#vars = vars;
    this.#makeEntry = (makeEntry<SO, TO>).bind(0, vars, brokenMap, scheduler);

    this.#connectProps = {
      outscope,
      lock,
      responseTimeout,
      limon: limon && setupHandlerRegistries(limon),
      transport: setupHandlerRegistries(transport),
      serializer: setupHandlerRegistries(serializer),
      complete,
    };

    this.onDataEvent = this.#hub.onDataEvent;
    this.onRequest = this.#hub.onRequest;
    this.addEventListener = this.#hub.addEventListener;
    this.removeEventListener = this.#hub.removeEventListener;
    this.extra = this.#hub.extra;

    this.size = objectDefineProperties({} as any as PoolSize, {
      target: {
        get: () => this.#vars.targetSize,
        set: (newSize: number) => {
          if (!Number.isSafeInteger(newSize) || newSize < 0)
            throw new Error("Invalid newSize");
          const vars = this.#vars,
            diff = newSize - vars.targetSize;
          if (diff === 0) return;
          vars.targetSize = newSize;
          diff > 0 ? this.#grow(diff) : this.#shrink(-diff);
        },
      },
      ready: {
        get: () =>
          this.#vars.actualSize - this.#brokenMap.size - this.#vars.acquired,
      },
      actual: {
        get: () => this.#vars.actualSize,
      },
      acquired: {
        get: () => this.#vars.acquired,
      },
    });

    objectFreeze(this.size);
    objectFreeze(this);
  }

  #grow = (diff: number) => {
    for (let i = 0; i < diff; i++) {
      const bus = this.#hub.create(this.#connectProps),
        busAddEventListener = bus.addEventListener;
      busAddEventListener("disconnected", reconnectImmediately);
      busAddEventListener("connected", this.#onBusReady);
      const entry = this.#makeEntry(bus);
      const { [ENTRY.BROKEN_SET]: brokenSetEntry } = entry;
      busAddEventListener("disconnected", brokenSetEntry);
      busAddEventListener("disconnecting", brokenSetEntry);
      busAddEventListener("connecting", brokenSetEntry);
      brokenSetEntry(bus);
      bus.start().catch();
      this.#vars.actualSize++;
    }
  };

  #stopEntry = async ({
    [ENTRY.BUS]: bus,
    [ENTRY.BROKEN_SET]: brokenSet,
  }: PoolEntry<SO, TO>) => {
    this.#vars.actualSize--;
    const { removeEventListener, stop } = bus;
    removeEventListener("disconnected", reconnectImmediately);
    removeEventListener("disconnected", brokenSet);
    removeEventListener("disconnecting", brokenSet);
    removeEventListener("connecting", brokenSet);
    removeEventListener("connected", this.#onBusReady);
    await stop();
    this.#brokenMap.delete(bus);
  };

  #shrink = (diff: number) => {
    for (let i = 0; i < diff; i++) this.#scheduler.pop().then(this.#stopEntry);
  };

  #acquire = async () => {
    while (1) {
      const entry = await this.#scheduler.pop();

      // if (!entry[ENTRY.QUEUED]) throw new Error("Invalid scheduler entry");

      const { [ENTRY.BUS]: bus } = entry;
      entry[ENTRY.QUEUED] = 0;
      if (bus.alive) {
        entry[ENTRY.ACQUIRED] = 1;
        this.#vars.acquired++;
        return entry;
      } else {
        this.#brokenMap.set(bus, entry);
      }
    }
  };

  acquire = async () => {
    const { [ENTRY.BUS]: bus, [ENTRY.DISPOSE]: dispose } =
      (await this.#acquire())!;
    const proxy = new BusProxy(bus, dispose);
    busProxyFR.register(proxy, proxy.dispose);
    return proxy;
  };
}
