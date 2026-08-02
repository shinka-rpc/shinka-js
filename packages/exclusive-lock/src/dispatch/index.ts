import type { AnyNBThisArg, FSMEvent, GenericFSMEventHandler } from "../types";
import { FSM } from "./fsm";

export const dispatch = (
  thisArg: AnyNBThisArg,
  { 0: eventType, 1: data }: FSMEvent,
) => {
  const cb = FSM.get(thisArg.state.state)?.get(eventType) as
    | GenericFSMEventHandler<any>
    | undefined;
  if (!cb)
    return thisArg.dispatchError(
      `Unknown event ${eventType} on state ${thisArg.state.state}`,
    );
  cb(thisArg, data);
};
