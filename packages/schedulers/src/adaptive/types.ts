import type { Asynq } from "@shinka-rpc/concurrency";
import type { PoolEntry } from "@shinka-rpc/core";

export type ExtraEntry = [accumulator: number, pending: number | null];

export type Comparator = (
  a: PoolEntry<any, any, ExtraEntry>,
  b: PoolEntry<any, any, ExtraEntry>,
) => number;

type AdaptivePush<SO, TO> = (
  asynq: Asynq<PoolEntry<SO, TO, ExtraEntry>>,
  entry: PoolEntry<SO, TO, ExtraEntry>,
) => void;

type AdaptivePop<SO, TO> = (
  asynq: Asynq<PoolEntry<SO, TO, ExtraEntry>>,
) => Promise<PoolEntry<SO, TO, ExtraEntry>>;

export type AdaptiveAPI<SO, TO> = {
  push: AdaptivePush<SO, TO>;
  pop: AdaptivePop<SO, TO>;
};
