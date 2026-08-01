import type { IQueue, MapFn, ForEachFn } from "./types";
import {
  type Entry,
  restoreInitialState,
  truncateFn,
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

const initialState: FIFOState<any> = Object.freeze({
  length: 0,
  head: null,
  tail: null,
});
const restoreInitialFIFOState = (restoreInitialState<FIFOState<any>>).bind(
  initialState,
);

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

  pop = () => popFn<T, FIFOState<T>>(this.#state, restoreInitialFIFOState);
  map = <M>(cb: MapFn<T, this, M>) => mapFn(this.#state, this, cb);
  forEach = (cb: ForEachFn<T, this>) => forEachFn(this.#state, this, cb);
  truncate = (value = 0) =>
    truncateFn(value, this.#state, restoreInitialFIFOState);
  [Symbol.iterator] = () => iteratorFn<T, FIFOState<T>>(this.#state);

  get length() {
    return this.#state.length;
  }
}
