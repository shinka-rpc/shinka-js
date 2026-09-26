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

type LIFOState<T> = {
  length: number;
  head: Entry<T> | null;
};

const { freeze: objectFreeze, seal: objectSeal } = Object;

const initialState: LIFOState<any> = objectFreeze({ length: 0, head: null });
const restoreInitialLIFOState = (restoreInitialState<LIFOState<any>>).bind(
  initialState,
);

export class LIFO<T> implements IQueue<T> {
  #state: LIFOState<T>;

  constructor() {
    this.#state = objectSeal({ ...initialState });
    objectFreeze(this);
  }

  push = (value: T) => {
    this.#state.length++;
    const entry: Entry<T> = [value, this.#state.head];
    this.#state.head = entry;
  };

  pop = () => popFn<T, LIFOState<T>>(this.#state, restoreInitialLIFOState);
  map = <M>(cb: MapFn<T, this, M>) => mapFn(this.#state, this, cb);
  forEach = (cb: ForEachFn<T, this>) => forEachFn(this.#state, this, cb);
  truncate = (value = 0) =>
    truncateFn(value, this.#state, restoreInitialLIFOState);
  [Symbol.iterator] = () => iteratorFn<T, LIFOState<T>>(this.#state);

  get length() {
    return this.#state.length;
  }
}
