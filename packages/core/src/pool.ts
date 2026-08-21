import type {
  TransportClient,
  SerializerRoot,
  IBus,
  ShinkaOn,
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  ManageEventListener,
  CompleteFn,
} from "./types";
import { Hub, type HubOptions, type HubConnectProps } from "./hub";
import { defaultSerializerRoot } from "./defaults";
import { setupHandlerRegistries } from "./shinka";
import { BusProxy } from "./bus-proxy";

export type IScheduler<T> = {
  push: (value: T) => void;
  pop: () => Promise<T>;
};

export type PoolProps<SO, TO, TC> = HubOptions<SO, TO> & {
  transport: TransportClient<SO, TO, any, TC>;
  serializer?: SerializerRoot<SO, TO, any>;
  scheduler: IScheduler<[IBus<SO, TO>, () => void]>;
  complete?: CompleteFn<SO, TO, TC>;
};

type PoolVars = {
  size: number;
};

const makePair = <SO, TO>(
  scheduler: IScheduler<[IBus<SO, TO>, () => void]>,
  acquired: Set<IBus<SO, TO>>,
  bus: IBus<SO, TO>,
) => {
  const pair = [bus, null] as any as [IBus<SO, TO>, () => void];
  const dispose = () => {
    scheduler.push(pair);
    acquired.delete(bus);
  };
  pair[1] = dispose;
  return pair;
};

export class Pool<SO, TO, TC> implements ShinkaOn<SO, TO, IBus<SO, TO>> {
  #hub!: Hub<SO, TO, TC>;
  #connect!: HubConnectProps<SO, TO, TC>;
  #scheduler!: IScheduler<[IBus<SO, TO>, () => void]>;
  #acquired!: Set<IBus<SO, TO>>;
  #vars!: PoolVars;

  public onRequest!: ShinkaOnRequest<SO, TO, IBus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<IBus<SO, TO>>;
  public addEventListener!: ManageEventListener<IBus<SO, TO>>;
  public removeEventListener!: ManageEventListener<IBus<SO, TO>>;

  public extra!: Record<string | symbol, any>;

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
    this.#hub = new Hub({ outscope, limon, lock, responseTimeout });
    this.#scheduler = scheduler;
    this.#acquired = new Set();
    this.#vars = { size: 0 };

    this.#connect = {
      transport: setupHandlerRegistries(transport),
      serializer: setupHandlerRegistries(serializer),
      complete,
    };

    this.onDataEvent = this.#hub.onDataEvent;
    this.onRequest = this.#hub.onRequest;
    this.addEventListener = this.#hub.addEventListener;
    this.removeEventListener = this.#hub.removeEventListener;
    this.extra = this.#hub.extra;

    Object.freeze(this);
  }

  #grow = async (diff: number) => {
    const promises: Promise<IBus<SO, TO>>[] = new Array(diff);
    for (let i = 0; i < diff; i++)
      promises[i] = this.#hub.connect(this.#connect);
    const newConnections = await Promise.all(promises);
    for (const c of newConnections)
      this.#scheduler.push(makePair(this.#scheduler, this.#acquired, c));
  };

  #shrink = async (diff: number) => {
    const promises = new Array(diff);
    for (let i = 0; i < diff; i++) {
      const { 0: c } = await this.#scheduler.pop();
      promises[i] = c.stop();
    }
    await Promise.all(promises);
  };

  acquire = async () => {
    const { 0: bus, 1: dispose } = await this.#scheduler.pop();
    return new BusProxy(bus, dispose);
  };

  setSize = async (newSize: number) => {
    if (newSize < 0) throw new Error("Invalid newSize");
    const diff = newSize - this.#vars.size;
    if (diff === 0) return;
    this.#vars.size = newSize;
    await (diff > 0 ? this.#grow(diff) : this.#shrink(-diff));
  };

  get size() {
    return this.#vars.size;
  }

  set size(newSize: number) {
    this.setSize(newSize);
  }
}
