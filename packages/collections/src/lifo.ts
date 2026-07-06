import type { IQueue, MapFn, ForEachFn } from "./types";
import {
  type Entry,
  makeResetStateFn,
  shrink,
  mapFn,
  forEachFn,
  iteratorFn,
  popFn,
} from "./qcommon";

type LIFOState<T> = {
  length: number;
  head: Entry<T> | null;
};

const initialState: LIFOState<any> = { length: 0, head: null };
const resetStateFn = makeResetStateFn(initialState);

export class LIFO<T> implements IQueue<T> {
  #state!: LIFOState<T>;

  constructor() {
    this.#state = Object.seal({ ...initialState });
    Object.freeze(this);
  }

  push = (value: T) => {
    this.#state.length++;
    const entry: Entry<T> = [value, this.#state.head];
    this.#state.head = entry;
  };

  pop = () => popFn<T, LIFOState<T>>(this.#state, resetStateFn);
  map = <M>(cb: MapFn<T, this, M>) => mapFn(this.#state, this, cb);
  forEach = (cb: ForEachFn<T, this>) => forEachFn(this.#state, this, cb);
  [Symbol.iterator] = () => iteratorFn<T, LIFOState<T>>(this.#state);

  get length() {
    return this.#state.length;
  }

  set length(n: number) {
    shrink(n, this.#state, resetStateFn);
  }
}
