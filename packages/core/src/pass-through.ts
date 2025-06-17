import type { CommonBus } from "./common";
import type { ClientBus } from "./client";
import type { ServerBus } from "./server";
import type { DataEventKey } from "./types";

type SourceBus = ClientBus | ServerBus;
type DestinationBus = CommonBus | ClientBus;

/**
 * Creates a pass-through for events from a source bus to a destination bus.
 * When an event with the specified key is received on the source bus,
 * it will be automatically forwarded to the destination bus.
 *
 * @param source - The source bus that will receive the original event
 * @param dest - The destination bus that will receive the forwarded event
 * @param key - The event key to pass through
 *
 * @example
 * ```typescript
 * // Forward all "user-update" events from contentBus to extensionBus
 * passThroughEvent(contentBus, extensionBus, "user-update");
 * ```
 */
export const passThroughEvent = (
  source: SourceBus,
  dest: DestinationBus,
  key: DataEventKey,
) => source.onDataEvent(key, (data) => dest.event(key, data));

/**
 * Creates a pass-through for requests from a source bus to a destination bus.
 * When a request with the specified key is received on the source bus,
 * it will be automatically forwarded to the destination bus and the response
 * will be sent back to the original requester.
 *
 * @param source - The source bus that will receive the original request
 * @param dest - The destination bus that will handle the request
 * @param key - The request key to pass through
 *
 * @example
 * ```typescript
 * // Forward all "get-data" requests from contentBus to extensionBus
 * passThroughRequest(contentBus, extensionBus, "get-data");
 * ```
 */
export const passThroughRequest = (
  source: SourceBus,
  dest: DestinationBus,
  key: DataEventKey,
) => source.onRequest(key, async (data) => await dest.request(key, data));
