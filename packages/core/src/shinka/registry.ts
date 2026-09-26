import type { DataEventKey, ReqRegEntry, RequestHandlerFn } from "./types";
import hooks from "./hook";
import { createRegistry, makeRequestRegistryHook } from "./util";

const requestRegistryHook = makeRequestRegistryHook(hooks);

export const createReqRegistry = <SO, TO, TA, B, R>() =>
  createRegistry<
    DataEventKey,
    RequestHandlerFn<SO, TO, TA, B>,
    ReqRegEntry<SO, TO, TA, B, R>
  >(requestRegistryHook);

export type ReqRegistryType = ReturnType<typeof createReqRegistry>;

export const createEventRegistry = <TA, B>() =>
  createRegistry<DataEventKey, (data: B, thisArg: TA) => void>();

export type EventRegistryType = ReturnType<typeof createEventRegistry>;
