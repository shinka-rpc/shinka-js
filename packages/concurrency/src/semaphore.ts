import { disposeContext, type DisposeContext } from "@shinka-rpc/util";
import { createOrUse, type MaybeConstructor } from "./util";

export interface ISemaphoreQueue<T> {
  push(value: T): void;
  pop(): T | undefined;
  readonly length: number;
}

type SemaphoreState = {
  capacity: number;
  value: number;
};

type ResolveReject<T> = [(value: T) => void, (reason: any) => void];

type ReleasedFlagContainer = [0 | 1];

const releaseFunction = (
  rc: ReleasedFlagContainer,
  state: SemaphoreState,
  queue: ISemaphoreQueue<ResolveReject<DisposeContext>>,
) => {
  if (rc[0]) throw new Error("already released");
  rc[0] = 1;
  if (++state.value < 1) return; // shrinking is supported
  const next = queue.pop();
  if (next) {
    state.value--;
    next[0](disposeContext(releaseFunction.bind(0, [0], state, queue)));
  }
};

const validateCapacity = (n: number) => {
  if (!Number.isInteger(n) || n < 1) throw new Error(`invalid capacity: ${n}`);
};

export type SemaphoreProps = {
  waiters: MaybeConstructor<ISemaphoreQueue<ResolveReject<DisposeContext>>>;
  capacity: number;
};

export class Semaphore {
  #waiters!: ISemaphoreQueue<ResolveReject<DisposeContext>>;
  #state!: SemaphoreState;

  constructor({ waiters, capacity }: SemaphoreProps) {
    validateCapacity(capacity);
    this.#waiters = createOrUse(waiters);
    this.#state = { value: capacity, capacity };
    Object.freeze(this);
  }

  #disposeContext = () =>
    disposeContext(releaseFunction.bind(0, [0], this.#state, this.#waiters));

  acquire = () =>
    new Promise<DisposeContext>((resolve, reject) => {
      if (this.#state.value < 1) return this.#waiters.push([resolve, reject]);
      this.#state.value--;
      resolve(this.#disposeContext());
    });

  rejectPending = (reason?: any) => {
    while (this.#waiters.length) this.#waiters.pop()![1](reason);
  };

  get value() {
    return this.#state.value;
  }

  get capacity() {
    return this.#state.capacity;
  }

  set capacity(value: number) {
    validateCapacity(value);
    this.#state.value -= this.#state.capacity - value;
    this.#state.capacity = value;

    while (this.#state.value > 0) {
      const next = this.#waiters.pop();
      if (!next) break;
      this.#state.value--;
      next[0](this.#disposeContext());
    }
  }
}
