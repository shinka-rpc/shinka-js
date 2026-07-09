import {
  acquireContext,
  type ReusablePromise,
  type Semaphore,
  type SemaphoreAcquireContext,
} from "@shinka-rpc/concurrency";

import {
  nbEvents,
  nbRequests,
  NBAcquire,
  NBConsensus,
  type NBThisArgState,
} from "./handlers/non-blocking";

import type { NBShinka } from "../types";

type ExclusiveLockReleaseThis = [
  NBShinka<any, any>,
  SemaphoreAcquireContext,
  ReusablePromise<void>,
  NBThisArgState,
];

const randInt32 = () => (Math.random() * 0x100000000) >>> 0;

function exclusiveLockRelease(this: ExclusiveLockReleaseThis) {
  const [shinka, semaphoreCTX, rPromise, state] = this;
  try {
    nbEvents.release(shinka.dataEvent);
  } finally {
    delete state.nonce;
    if (!rPromise.isDone) rPromise.resolve();
    semaphoreCTX.release();
  }
}

type ExclusiveLockAcquireThis = [
  Semaphore,
  ReusablePromise<void>,
  NBAcquire,
  NBShinka<any, any>,
  NBThisArgState,
];

export async function exclusiveLockAcquire(
  this: ExclusiveLockAcquireThis,
  timeout: number,
) {
  let semaphoreCTX: SemaphoreAcquireContext | null = null,
    consensusResult = NBConsensus.UNKNOWN;
  const [semaphore, rPromise, nbAcquire, shinka, state] = this;
  try {
    semaphoreCTX = await semaphore.acquire();

    if (Object.hasOwn(state, "nonce")) throw new Error("malformed state");

    while (consensusResult === NBConsensus.UNKNOWN) {
      const nonce = randInt32();
      state.nonce = nonce;
      consensusResult = await nbRequests.acquire(
        shinka.request,
        nbAcquire,
        timeout,
        nonce,
      );
    }

    if (consensusResult === NBConsensus.FAIL) await rPromise.reset();

    return acquireContext(
      exclusiveLockRelease.bind([shinka, semaphoreCTX, rPromise, state]),
    );
  } catch (e) {
    if (semaphoreCTX) semaphoreCTX.release();
    throw e;
  }
}
