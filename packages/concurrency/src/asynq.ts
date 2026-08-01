import type { IQueue } from "@shinka-rpc/collections";
import { createOrUse, type MaybeConstructor } from "./util";

type ResolveReject<T> = [
  (value: T | PromiseLike<T>) => void,
  (reason?: any) => void,
];

export type AsynqProps<T> = {
  items: MaybeConstructor<IQueue<T>>;
  waiters: MaybeConstructor<IQueue<ResolveReject<T>>>;
};

export class Asynq<T> {
  #items!: IQueue<T>;
  #waiters!: IQueue<ResolveReject<T>>;

  constructor({ items, waiters }: AsynqProps<T>) {
    this.#items = createOrUse(items);
    this.#waiters = createOrUse(waiters);
    Object.freeze(this);
  }

  push = (value: T) => {
    if (this.#waiters.length) return this.#waiters.pop()![0](value);
    this.#items.push(value);
  };

  pop = () =>
    new Promise<T>((resolve, reject) => {
      if (this.#items.length) return resolve(this.#items.pop()!);
      this.#waiters.push([resolve, reject]);
    });

  truncate = (n = 0) => this.#items.truncate(n);

  #cbAdapter =
    <M>(cb: (val: T, thisArg: this) => M) =>
    (val: T) =>
      cb(val, this);

  map = <M>(cb: (val: T, thisArg: this) => M) =>
    this.#items.map(this.#cbAdapter(cb));

  forEach = (cb: (val: T, thisArg: this) => void) =>
    this.#items.forEach(this.#cbAdapter(cb));

  get length() {
    return this.#items.length;
  }
}
