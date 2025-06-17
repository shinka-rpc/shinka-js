import type { ClientBus } from "./client";
import type { ServerBus } from "./server";

/**
 * Registers a beforeunload event handler that will notify the other end of the bus
 * when the page is about to be unloaded. This ensures proper cleanup of resources
 * and notifies connected peers about the disconnection.
 *
 * The function registers the bus's `willDie` method as a handler for the 'beforeunload' event,
 * which will be called when the page is about to be closed or navigated away from.
 *
 * @param bus - The bus instance to register the beforeunload handler for
 *
 * @example
 * ```typescript
 * const bus = new ClientBus({ factory });
 * registerBeforeUnload(bus); // Will call bus.willDie() when page unloads
 * ```
 */
export const registerBeforeUnload = (bus: ClientBus | ServerBus) =>
  self.addEventListener("beforeunload", bus.willDie);
