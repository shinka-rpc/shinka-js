import type { DataEventKey, ReqRegEntry, ReqRegEntryCb } from "./types";
import hooks from "./high-order-hook";
import { createRegistry, makeRequestRegistryHook } from "./util";

const requestRegistryHook = makeRequestRegistryHook(hooks);

export const createHOReqRegistry = <SO, TO, TA, B, R>() =>
  createRegistry<
    DataEventKey,
    ReqRegEntryCb<TA, B, R>,
    ReqRegEntry<SO, TO, TA, B, R>
  >(requestRegistryHook);

export type HOReqRegistryType = ReturnType<typeof createHOReqRegistry>;

export const createHOEventRegistry = <TA, B>() =>
  createRegistry<DataEventKey, (data: B, thisArg: TA) => void>();

export type HOEventRegistryType = ReturnType<typeof createHOEventRegistry>;
