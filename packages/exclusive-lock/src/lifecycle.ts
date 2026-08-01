import type {
  StateKey,
  IdleState,
  NBThisArgBaseOnStart,
  AnyNBThisArg,
} from "./types";
import { StateType, FSMEventType } from "./const-enums";
import { dispatch } from "./dispatch";

export const idleState: IdleState = Object.freeze({
  state: StateType.IDLE,
  local: null,
  remote: null,
});

export function onStart(this: NBThisArgBaseOnStart, thisArg: AnyNBThisArg) {
  Object.assign(thisArg.state, { base: this }, idleState);
}

// const keys: StateKey[] = ["local", "remote"];

export const onStop = (thisArg: AnyNBThisArg) =>
  dispatch(thisArg, [FSMEventType.STOP, null]);

export const onTimeout = (
  thisArg: AnyNBThisArg,
  timeout: number,
  key: StateKey,
) => dispatch(thisArg, [FSMEventType.TIMEOUT, { timeout, key }]);
