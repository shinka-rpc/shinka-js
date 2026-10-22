import { asyncDisposeContext, type DisposeContext } from "@shinka-rpc/util";
import type { NBAcquire } from "@shinka-rpc/core";
import type { NBThisArg } from "@shinka-rpc/core";

import { dispatch } from "../dispatch";
import { FSMEventType } from "../const-enums";

import type { NBThisArgState, AnyNBThisArg } from "../types";

const releaseLocal = (thisArg: AnyNBThisArg, semaphoreCtx: DisposeContext) =>
  new Promise<void>((resolve, reject) =>
    dispatch(thisArg, [
      FSMEventType.LOCAL_RELEASE,
      { semaphoreCtx, resolve, reject },
    ]),
  );

export const acquire = async (
  thisArg: NBThisArg<any, any, NBThisArgState>,
  target: NBAcquire,
  timeout: number,
) => {
  const { semaphore } = thisArg;
  const semaphoreCtx = await semaphore.acquire();
  try {
    // if (!raceResolvedEvent.isDone) await raceResolvedEvent;
    await new Promise((resolve, reject) =>
      dispatch(thisArg, [
        FSMEventType.LOCAL_ACQUIRE,
        { target, timeout, resolve, reject },
      ]),
    );
    return asyncDisposeContext(releaseLocal.bind(0, thisArg, semaphoreCtx));
  } catch (e) {
    semaphoreCtx.dispose();
    throw e;
  }
};
