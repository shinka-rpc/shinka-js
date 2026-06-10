/**
 * Used by `Bus` and `Client`
 */

import type { ShinkaEventListener, EventListenerType } from "../types";
import { baseListenerFactory } from "./base-listener-factory";

const eventListenerTypes: EventListenerType[] = [
  "connect",
  "disconnect",
  "error",
];

export const createEventListeners = baseListenerFactory(
  eventListenerTypes,
  Set<ShinkaEventListener<any>>,
);

export const createEventListenersBanned = baseListenerFactory(
  eventListenerTypes,
  WeakSet<ShinkaEventListener<any>>,
);
