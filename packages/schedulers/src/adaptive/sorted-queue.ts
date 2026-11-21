import { BTree } from "@tylerbu/sorted-btree-es6";
import type { MapFn, ForEachFn, IQueue } from "@shinka-rpc/collections";

const { freeze: objectFreeze } = Object;

export class SortedQueue<T> implements IQueue<T> {
  #btree: BTree<T, void>;

  constructor(comparator: (a: T, b: T) => number) {
    this.#btree = new BTree(undefined, comparator);
    objectFreeze(this);
  }

  #mapAdapter =
    <R>(cb: (o: T, thisArg: any) => R) =>
    (o: T) =>
      cb(o, this);

  push = (val: T) => this.#btree.set(val);
  pop = () => {
    const btree = this.#btree;
    if (!btree.length) return;
    const key = btree.maxKey()!;
    btree.delete(key);
    return key;
  };
  map = <M>(cb: MapFn<T, IQueue<T>, M>) =>
    this.#btree.keysArray().map(this.#mapAdapter(cb));

  forEach = (cb: ForEachFn<T, IQueue<T>>) =>
    this.#btree.keysArray().forEach(this.#mapAdapter(cb));

  truncate = (n = 0) => {
    const btree = this.#btree,
      keys = btree.keysArray();
    if (n >= keys.length) return;
    const delKeys = keys.slice(n);
    btree.deleteKeys(delKeys);
  };

  [Symbol.iterator] = () => this.#btree.keysArray()[Symbol.iterator]();

  get length() {
    return this.#btree.length;
  }
}
