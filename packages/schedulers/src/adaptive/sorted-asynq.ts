import { Asynq, type AsynqProps } from "@shinka-rpc/concurrency";
import { SortedQueue } from "./sorted-queue";

export type SortedAsynqProps<T> = {
  comparator: (a: T, b: T) => number;
  waiters: AsynqProps<T>["waiters"];
};

export const sortedAsynq = <T>({ comparator, waiters }: SortedAsynqProps<T>) =>
  new Asynq({ items: new SortedQueue(comparator), waiters });
