import type { IScheduler } from "@shinka-rpc/core";
import { FIFO } from "@shinka-rpc/collections";
import { PoolExtraSym } from "@shinka-rpc/core";

import type { ExtraEntry, Comparator, AdaptiveAPI } from "./types";
import { sortedAsynq } from "./sorted-asynq";

const { freeze: objectFreeze } = Object;

const initExtra = () => [0, null] satisfies ExtraEntry;

export const adaptive = <SO, TO>(
  comparator: Comparator,
  { push, pop }: AdaptiveAPI<SO, TO>,
) => {
  const asynq = sortedAsynq({ comparator, waiters: FIFO });
  return objectFreeze({
    push: push.bind(this, asynq),
    pop: pop.bind(this, asynq),
    [PoolExtraSym]: initExtra,
  }) as any as IScheduler<SO, TO, ExtraEntry>;
};
