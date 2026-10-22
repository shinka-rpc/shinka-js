import hooksHighOrderRequest from "./high-order-hook-request";
import { createRegistry, makeRequestRegistryHook } from "./util";

const requestRegistryHook = makeRequestRegistryHook(hooksHighOrderRequest);

export const createHOReqRegistry = <SO, TO, TA, B, R>() =>
  createRegistry(requestRegistryHook<SO, TO, TA, B, R>);

export type HOReqRegistryType = ReturnType<typeof createHOReqRegistry>;
