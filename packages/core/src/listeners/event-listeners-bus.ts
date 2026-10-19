/**
 * Used by `Bus` and `Client`
 */

import { baseListenerFactory } from "./base-listener-factory";
import type { ShinkaEventListener, EventListenerType } from "./types";

const eventListenerTypes: EventListenerType[] = [
  "connected",
  "connecting",
  "disconnected",
  "disconnecting",
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
