import type { IQueue } from "@shinka-rpc/collections";
import { createOrUse, type MaybeConstructor } from "./util";

type SemaphoreState = {
  initial: number;
  value: number;
};

// @ts-expect-error: 2503
if (!Symbol.dispose) Symbol.dispose = Symbol.for("Symbol.dispose");

export type SemaphoreAcquireContext = Disposable & {
  release: () => void;
};

type ReleaseFunctionThis = [
  boolean,
  SemaphoreState,
  IQueue<(value: SemaphoreAcquireContext) => void>,
];

const acquireContext = (release: () => void) =>
  Object.freeze({
    release,
    [Symbol.dispose]: release,
  } as SemaphoreAcquireContext);

function releaseFunction(this: ReleaseFunctionThis) {
  if (this[0]) throw new Error("already released");
  this[0] = true;
  if (++this[1].value < 1) return; // shrinking is supported
  const next = this[2].pop();
  if (next) {
    this[1].value--;
    next(acquireContext(releaseFunction.bind([false, this[1], this[2]])));
  }
}

const validateCount = (n: number) => {
  if (!Number.isInteger(n) || n < 1) throw new Error(`invalid count: ${n}`);
};

export type SemaphoreProps = {
  waiters: MaybeConstructor<IQueue<(value: SemaphoreAcquireContext) => void>>;
  count: number;
};

export class Semaphore {
  #waiters!: IQueue<(value: SemaphoreAcquireContext) => void>;
  #state!: SemaphoreState;

  constructor({ waiters, count }: SemaphoreProps) {
    validateCount(count);
    this.#waiters = createOrUse(waiters);
    this.#state = { value: count, initial: count };
    Object.freeze(this);
  }

  acquire = () =>
    new Promise<SemaphoreAcquireContext>((resolve, reject) => {
      if (this.#state.value < 1) return this.#waiters.push(resolve);
      this.#state.value--;
      resolve(
        acquireContext(
          releaseFunction.bind([false, this.#state, this.#waiters]),
        ),
      );
    });

  get value() {
    return this.#state.value;
  }

  get count() {
    return this.#state.initial;
  }

  set count(value: number) {
    validateCount(value);
    this.#state.value -= this.#state.initial - value;
    this.#state.initial = value;

    while (this.#state.value > 0) {
      const next = this.#waiters.pop();
      if (!next) break;
      this.#state.value--;
      next(
        acquireContext(
          releaseFunction.bind([false, this.#state, this.#waiters]),
        ),
      );
    }
  }
}
