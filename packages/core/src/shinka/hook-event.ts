import type { DispatchError } from "./types";
import type { EventHooks } from "./util";

const eventRegistryHookSync =
  <TA, B>(cb: (body: B, thisArg: TA) => void) =>
  (body: B, thisArg: TA, dispatchError: DispatchError) => {
    try {
      cb(body, thisArg);
    } catch (e) {
      dispatchError(e);
    }
  };

const eventRegistryHookAsync =
  <TA, B>(cb: (body: B, thisArg: TA) => Promise<void>) =>
  (body: B, thisArg: TA, dispatchError: DispatchError) =>
    cb(body, thisArg).catch(dispatchError);

export default {
  Function: eventRegistryHookSync,
  AsyncFunction: eventRegistryHookAsync,
} satisfies EventHooks;
