import type { IBus } from "../types";
import type { DisposeContext } from "@shinka-rpc/util";

export type DisposeCb = () => void;

export type DisposableIBus<SO, TO> = IBus<SO, TO> & DisposeContext;

export type IScheduler<T> = {
  push: (value: T) => void;
  pop: () => Promise<T>;
};
