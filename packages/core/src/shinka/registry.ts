import hooksRequest from "./hook-request";
import hooksEvent from "./hook-event";
import {
  createRegistry,
  makeRequestRegistryHook,
  makeEventRegistryHook,
} from "./util";

const requestRegistryHook = makeRequestRegistryHook(hooksRequest);
const eventRegistryHook = makeEventRegistryHook(hooksEvent);

export const createReqRegistry = <SO, TO, TA, B, R>() =>
  createRegistry(requestRegistryHook<SO, TO, TA, B, R>);

export type ReqRegistryType = ReturnType<typeof createReqRegistry>;

export const createEventRegistry = <TA, B>() =>
  createRegistry(eventRegistryHook<TA>);

export type EventRegistryType = ReturnType<typeof createEventRegistry>;
