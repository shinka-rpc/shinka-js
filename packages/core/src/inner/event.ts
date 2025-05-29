import { EventKeys, RegistryKey } from "../constants";
import type { DataEventHandler } from "../types";
import type { ClientBus } from "../client";
import type { CommonBus } from "../common";
import type { EventRegistryType } from "../factory/registry";

interface Events {
  [key: number]: DataEventHandler<any, ClientBus & CommonBus>;
}

const events: Events = {
  [EventKeys.INITIALIZE]: () => {},
  [EventKeys.TERMINATE]: (_, thisArg) => {
    thisArg[RegistryKey].unregister(thisArg);
  },
};

export const registerEventsInner = (register: EventRegistryType[1]) =>
  Object.entries(events).forEach(([k, v]) => register(k, v));
