import type { AnyNBThisArg, FSMEvent, GenericFSMEventHandler } from "../types";
import { rootMap } from "./handlers";

export const dispatch = (
  thisArg: AnyNBThisArg,
  { 0: eventType, 1: data }: FSMEvent,
) => {
  const cb = rootMap.get(thisArg.state.state)?.get(eventType) as
    | GenericFSMEventHandler<any>
    | undefined;
  if (!cb)
    return thisArg.dispatchError(
      `Unknown event ${eventType} on state ${thisArg.state.state}`,
    );
  cb(thisArg, data);
};
