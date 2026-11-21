import { Asynq } from "@shinka-rpc/concurrency";
import { FIFO } from "@shinka-rpc/collections";

export const roundRobin = <T>() => new Asynq<T>({ items: FIFO, waiters: FIFO });
