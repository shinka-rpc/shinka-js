import type { ShinkaEventListener, EventListenerType } from "../types";
import { baseListenerFactory } from "./base-listener-factory";

const eventListenerTypes: EventListenerType[] = ["connect", "disconnect"];

export const createEventListeners = baseListenerFactory(
  eventListenerTypes,
  Set<ShinkaEventListener<any>>,
);

export const createEventListenersBanned = baseListenerFactory(
  eventListenerTypes,
  WeakSet<ShinkaEventListener<any>>,
);
