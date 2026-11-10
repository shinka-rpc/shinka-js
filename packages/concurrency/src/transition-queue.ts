import type { Resolve, Reject } from "./types";
import { Asynq } from "./asynq";

type TransitionQueueEntry<A extends unknown[], R> = [
  A,
  (...args: A) => Promise<R>,
  Resolve<R>,
  Reject,
];

const worker = async <A extends unknown[], R>(
  q: Asynq<TransitionQueueEntry<A, R>>,
) => {
  while (1) {
    const { 0: args, 1: transitionFn, 2: resolve, 3: reject } = await q.pop();
    try {
      resolve(await transitionFn(...args));
    } catch (e) {
      reject(e);
    }
  }
};

// `any` at `Asynq<any>` is used for practical reasons
export const createTransitionQueue = (q: Asynq<any>) => {
  worker(q);
  return <A extends unknown[], R>(transitionFn: (...args: A) => Promise<R>) =>
    (...args: A) => {
      const { promise, reject, resolve } = Promise.withResolvers<R>();
      q.push([args, transitionFn, resolve, reject]);
      return promise;
    };
};

export type TransitionQueue = ReturnType<typeof createTransitionQueue>;
