import type {
  DispatchError,
  FnConstructorName,
  ShinkaOnDataEventMeta,
} from "./types";

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

export type EventHooks = Record<
  FnConstructorName,
  (
    cb: (body: any, thisArg: any) => any,
    metadata?: ShinkaOnDataEventMeta,
  ) => (body: any, thisArg: any, dispatchError: DispatchError) => any
>;

export default {
  Function: eventRegistryHookSync,
  AsyncFunction: eventRegistryHookAsync,
} as EventHooks;
