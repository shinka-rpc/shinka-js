import { EventKeys } from "../constants";
import type { CommonBus } from "../common";
import type { EventRegistryType } from "../factory/registry";

const events = new Map<EventKeys, (data: any, thisArg: CommonBus) => void>([
  [EventKeys.INITIALIZE, () => {}],
  [EventKeys.TERMINATE, (_, thisArg) => thisArg.stop()],
]);

export const registerEventsInner = (register: EventRegistryType[1]) => {
  for (const [k, v] of events.entries()) register(k, v);
};
