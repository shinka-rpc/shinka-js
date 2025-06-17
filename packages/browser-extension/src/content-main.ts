import type { ClientBus, FactoryData } from "@shinka-rpc/core";

/**
 * Creates a factory function for setting up client-side communication in a browser extension.
 * This factory handles message passing between the content script and the main window using the window.postMessage API.
 *
 * @param TAG_ONMESSAGE - A unique identifier for incoming messages
 * @param TAG_SEND - A unique identifier for outgoing messages
 * @returns A factory function that takes a ClientBus instance and returns a FactoryData object
 *
 * @example
 * ```typescript
 * // Create a factory with unique message tags
 * const factory = createClientFactory("CONTENT_MESSAGE", "CONTENT_SEND");
 *
 * // Use the factory to set up a client bus
 * const bus = new ClientBus({
 *   factory: factory,
 *   // ... other options
 * });
 * ```
 */
export const createClientFactory =
  (TAG_ONMESSAGE: unknown, TAG_SEND: unknown) => async (bus: ClientBus) => {
    const _onmessage = (event: MessageEvent) => {
      if (event.source === window && Array.isArray(event.data)) {
        const [tag, payload] = event.data;
        if (tag === TAG_ONMESSAGE) bus.onMessage(payload);
      }
    };
    window.addEventListener("message", _onmessage);
    const close = async () => window.removeEventListener("message", _onmessage);
    const send = async (data: unknown) =>
      window.postMessage([TAG_SEND, data], "*");
    return { send, close } as FactoryData;
  };
