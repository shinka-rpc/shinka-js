import { RequestKeys } from "../constants";
import type { RequestHandler } from "../types";
import type { ClientBus } from "../client";
import type { CommonBus } from "../common";
import type { ReqRegistryType } from "../factory/registry";

interface Requests {
  [key: number]: RequestHandler<ClientBus & CommonBus, any>;
}

const requests: Requests = {
  [RequestKeys.PING]: () => {},
};

/**
 * Registers internal request handlers for bus lifecycle events.
 * This function is used internally to set up standard request handling
 * for core bus functionality like ping requests.
 *
 * @param register - Function to register request handlers
 *
 * @example
 * ```typescript
 * // Internal usage in bus initialization
 * registerRequestsInner((key, handler) => {
 *   // Register the handler for the given key
 * });
 * ```
 */
export const registerRequestsInner = (register: ReqRegistryType[1]) =>
  Object.entries(requests).forEach(([k, v]) => register(k, v));
