import {
  acquireContext,
  type ReusablePromise,
  type Semaphore,
  type SemaphoreAcquireContext,
} from "@shinka-rpc/concurrency";

import type { IQueue } from "@shinka-rpc/collections";
import { Consensus } from "@shinka-rpc/consensus";
import { createNonces } from "./consensus-protocol";

import {
  nbEvents,
  nbRequests,
  NBAcquire,
  type NBThisArgState,
} from "./handlers/non-blocking";

import type { NBShinka, SendFn } from "../types";

type ExclusiveLockReleaseThis = [
  NBShinka<any, any>,
  SemaphoreAcquireContext,
  NBThisArgState,
];

function exclusiveLockRelease(this: ExclusiveLockReleaseThis) {
  const [shinka, semaphoreCTX, state] = this;
  try {
    nbEvents.release(shinka.dataEvent);
  } finally {
    delete state.nonces;
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
    consensusResult = Consensus.UNKNOWN;
  const [semaphore, rPromise, nbAcquire, shinka, state] = this;
  try {
    semaphoreCTX = await semaphore.acquire();

    if (Object.hasOwn(state, "nonce")) throw new Error("malformed state");

    while (consensusResult === Consensus.UNKNOWN) {
      const nonces = createNonces();
      state.nonces = nonces;
      consensusResult = await nbRequests.acquire(
        shinka.request,
        nbAcquire,
        timeout,
        nonces,
      );
    }

    if (consensusResult === Consensus.FAIL) await rPromise.reset();

    return acquireContext(
      exclusiveLockRelease.bind([shinka, semaphoreCTX, state]),
    );
  } catch (e) {
    if (semaphoreCTX) semaphoreCTX.release();
    if (!rPromise.isDone) rPromise.resolve();
    delete state.nonces;
    throw e;
  }
}
