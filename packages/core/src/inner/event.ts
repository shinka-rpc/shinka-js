import { EventKeys } from "../constants";
import type { DataEventHandler } from "../types";
import type { ClientBus } from "../client";
import type { CommonBus } from "../common";
import type { EventRegistryType } from "../factory/registry";

interface Events {
  [key: number]: DataEventHandler<any, ClientBus & CommonBus>;
}

/**
 * Internal event handlers for bus lifecycle events.
 * These handlers manage initialization and termination of the bus.
 */
const events: Events = {
  [EventKeys.INITIALIZE]: () => {},
  [EventKeys.TERMINATE]: (_, thisArg) => thisArg.stop(),
};

/**
 * Registers internal event handlers for bus lifecycle events.
 * This function is used internally to set up standard event handling
 * for bus initialization and termination.
 *
 * @param register - Function to register event handlers
 *
 * @example
 * ```typescript
 * // Internal usage in bus initialization
 * registerEventsInner((key, handler) => {
 *   // Register the handler for the given key
 * });
 * ```
 */
export const registerEventsInner = (register: EventRegistryType[1]) =>
  Object.entries(events).forEach(([k, v]) => register(k, v));
