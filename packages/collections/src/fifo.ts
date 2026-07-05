import type { IQueue } from "./types";
import { type Entry, shrink, mapFn, forEachFn, popFn } from "./qcommon";

type FIFOState<T> = {
  length: number;
  head: Entry<T> | undefined;
  tail: Entry<T> | undefined;
};

const cleanOnShrink = <T>(state: FIFOState<T>) => {
  state.head = undefined;
  state.tail = undefined;
  state.length = 0;
};

export class FIFO<T> implements IQueue<T> {
  #state!: FIFOState<T>;

  constructor() {
    this.#state = { length: 0, head: undefined, tail: undefined };
    Object.freeze(this);
  }

  push = (value: T) => {
    const entry: Entry<T> = [value, undefined];
    const { tail } = this.#state;
    if (tail === undefined) this.#state.head = entry;
    else tail[1] = entry;
    this.#state.tail = entry;
    this.#state.length++;
  };

  pop = () => {
    const head: Entry<T> | undefined = popFn(this.#state);
    if (head === undefined) return;
    const [val, next] = head;
    if (next === undefined) this.#state.tail = undefined;
    return val;
  };

  map = <M>(cb: (val: T, thisArg: this) => M) => mapFn(this.#state, this, cb);
  forEach = (cb: (val: T, thisArg: this) => void) =>
    forEachFn(this.#state, this, cb);

  get length() {
    return this.#state.length;
  }

  set length(n: number) {
    shrink(n, this.#state, cleanOnShrink);
  }
}
