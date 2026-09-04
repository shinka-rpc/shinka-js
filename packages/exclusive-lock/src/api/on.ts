import { NBAcquire } from "@shinka-rpc/core";
import type { NBThisArg, ExclusiveLockOn } from "@shinka-rpc/core";

import { dispatch } from "../dispatch";
import { FSMEventType } from "../const-enums";

import type { NBThisArgState, AnyNBThisArg } from "../types";

const acquire = (
  thisArg: NBThisArg<any, any, NBThisArgState>,
  target: NBAcquire,
  timeout: number,
  nonces: number[],
) => {
  dispatch(thisArg, [FSMEventType.REMOTE_ACQUIRE, { target, nonces, timeout }]);
};

const accept = (thisArg: NBThisArg<any, any, NBThisArgState>) => {
  dispatch(thisArg, [FSMEventType.ACCEPT, null]);
};

const release = (thisArg: AnyNBThisArg) =>
  dispatch(thisArg, [FSMEventType.REMOTE_RELEASE, null]);

export const on: ExclusiveLockOn<any, any, NBThisArgState> = Object.freeze({
  acquire,
  accept,
  release,
});
