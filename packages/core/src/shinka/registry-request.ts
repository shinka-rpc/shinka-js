import hooksRequest from "./hook-request";
import { createRegistry, makeRegistryHook } from "./util";

const requestRegistryHook = makeRegistryHook(hooksRequest);

export const createReqRegistry = () => createRegistry(requestRegistryHook);

export type ReqRegistryType = ReturnType<typeof createReqRegistry>;
