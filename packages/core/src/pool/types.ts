import type { IBus } from "../types";
import { PoolExtraSym } from "./const";
import type { DisposeContext } from "@shinka-rpc/util";

export type DisposeCb = () => void;

export type DisposableIBus<SO, TO> = IBus<SO, TO> & DisposeContext;

export type PoolEntry<SO, TO, E = any> = [
  extra: E,
  bus: IBus<SO, TO>,
  setBroken: (bus: IBus<SO, TO>) => void,
  dispose: () => void,
  queued: 0 | 1,
  acquired: 0 | 1,
];

export type AbstractScheduler<T> = {
  push: (value: T) => void;
  pop: () => Promise<T>;
  [PoolExtraSym]?: () => any;
};

export type IScheduler<SO, TO, E> = AbstractScheduler<PoolEntry<SO, TO, E>>;
