import type {
  StateKey,
  IdleState,
  NBThisArgBaseOnStart,
  AnyNBThisArg,
} from "./types";
import { StateType, FSMEventType } from "./const-enums";
import { dispatch } from "./dispatch";

const { freeze: objectFreeze, assign: objectAssign } = Object;

export const idleState: IdleState = objectFreeze({
  state: StateType.IDLE,
  local: null,
  remote: null,
});

export function onStart(this: NBThisArgBaseOnStart, thisArg: AnyNBThisArg) {
  objectAssign(thisArg.state, { base: this }, idleState);
}

export const onStop = (thisArg: AnyNBThisArg) =>
  dispatch(thisArg, [FSMEventType.STOP, null]);

export const onTimeout = (
  thisArg: AnyNBThisArg,
  timeout: number,
  key: StateKey,
) => dispatch(thisArg, [FSMEventType.TIMEOUT, { timeout, key }]);
