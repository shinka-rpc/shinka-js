export type MapFn<T, TA, M> = (val: T, thisArg: TA) => M;
export type ForEachFn<T, TA> = MapFn<T, TA, void>;

export interface IQueue<T> {
  push: (value: T) => void;
  pop: () => T | undefined;
  map: <M>(cb: MapFn<T, IQueue<T>, M>) => M[];
  forEach: (cb: ForEachFn<T, IQueue<T>>) => void;
  truncate: (value?: number) => void;
  [Symbol.iterator]: () => Iterator<T, void, void>;
  length: number;
}
