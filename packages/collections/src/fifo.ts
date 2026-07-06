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

type FIFOState<T> = {
  length: number;
  head: Entry<T> | null;
  tail: Entry<T> | null;
};

const initialState: FIFOState<any> = { length: 0, head: null, tail: null };
const resetStateFn = makeResetStateFn(initialState);

export class FIFO<T> implements IQueue<T> {
  #state!: FIFOState<T>;

  constructor() {
    this.#state = Object.seal({ ...initialState });
    Object.freeze(this);
  }

  push = (value: T) => {
    const entry: Entry<T> = [value, null];
    const { tail } = this.#state;
    if (tail === null) this.#state.head = entry;
    else tail[1] = entry;
    this.#state.tail = entry;
    this.#state.length++;
  };

  pop = () => popFn<T, FIFOState<T>>(this.#state, resetStateFn);
  [Symbol.iterator] = () => iteratorFn<T, FIFOState<T>>(this.#state);
  map = <M>(cb: MapFn<T, this, M>) => mapFn(this.#state, this, cb);
  forEach = (cb: ForEachFn<T, this>) => forEachFn(this.#state, this, cb);

  get length() {
    return this.#state.length;
  }

  set length(n: number) {
    shrink(n, this.#state, resetStateFn);
  }
}
