export interface IQueue<T> {
  push: (value: T) => void;
  pop: () => T | undefined;
  map: <M>(cb: (val: T, thisArg: IQueue<T>) => M) => M[];
  forEach: (cb: (val: T, thisArg: IQueue<T>) => void) => void;
  length: number;
}
