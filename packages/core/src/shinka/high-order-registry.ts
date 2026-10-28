import hooksHighOrderRequest from "./high-order-hook-request";
import { createRegistry, makeRegistryHook } from "./util";

const requestRegistryHook = makeRegistryHook(hooksHighOrderRequest);

export const createHOReqRegistry = () => createRegistry(requestRegistryHook);

export type HOReqRegistryType = ReturnType<typeof createHOReqRegistry>;
