import type { IQueue, MapFn, ForEachFn } from "./types";
import {
  type Entry,
  shrink,
  mapFn,
  forEachFn,
  popFn,
  iteratorFn,
} from "./qcommon";

type LIFOState<T> = {
  length: number;
  head: Entry<T> | null;
};

const cleanOnShrink = <T>(state: LIFOState<T>) => {
  state.head = null;
  state.length = 0;
};

export class LIFO<T> implements IQueue<T> {
  #state!: LIFOState<T>;

  constructor() {
    this.#state = { length: 0, head: null };
    Object.freeze(this);
  }

  push = (value: T) => {
    this.#state.length++;
    const entry: Entry<T> = [value, this.#state.head];
    this.#state.head = entry;
  };

  pop = () => popFn<T, LIFOState<T>>(this.#state, cleanOnShrink);
  map = <M>(cb: MapFn<T, this, M>) => mapFn(this.#state, this, cb);
  forEach = (cb: ForEachFn<T, this>) => forEachFn(this.#state, this, cb);
  [Symbol.iterator] = () => iteratorFn<T, LIFOState<T>>(this.#state);

  get length() {
    return this.#state.length;
  }

  set length(n: number) {
    shrink(n, this.#state, cleanOnShrink);
  }
}
