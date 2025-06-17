import type { ServerBus, CompleteFN, CommonBus } from "@shinka-rpc/core";

/**
 * Type definition for a callback function that creates a completion handler for a Chrome runtime port.
 * This callback is used to set up cleanup and completion logic when a port connection is established.
 *
 * @param port - The Chrome runtime port instance
 * @returns A function that will be called when the port connection is complete
 */
export type CompleteCB = (port: chrome.runtime.Port) => CompleteFN;

/**
 * Creates a factory function for handling Chrome runtime port connections in a browser extension.
 * This factory sets up message passing between the extension's background/service worker and other contexts
 * using Chrome's runtime messaging system.
 *
 * @param bus - The ServerBus instance to handle the connection
 * @param complete - Optional callback function to handle port completion (defaults to no-op)
 * @returns A factory function that takes a Chrome runtime port and sets up the connection
 *
 * @example
 * ```typescript
 * // Create a server bus
 * const serverBus = new ServerBus();
 *
 * // Create a port factory
 * const factory = messagePortFactory(serverBus);
 *
 * // Use the factory to handle a port connection
 * chrome.runtime.onConnect.addListener(factory);
 * ```
 */
export const messagePortFactory =
  (bus: ServerBus, complete: CompleteCB = () => () => {}) =>
  async (port: chrome.runtime.Port) => {
    const onconnect = async (bus: CommonBus) => {
      port.onMessage.addListener(bus.onMessage);
      port.onDisconnect.addListener(() => client.stop());
      self.addEventListener("beforeunload", bus.willDie);
      const send = async (data: unknown) => port.postMessage(data);
      const close = async () => {
        // chrome-specific issue: worker stops unexpectedly
        self.removeEventListener("beforeunload", bus.willDie);
        port.disconnect();
      };
      return { send, close };
    };
    const client = await bus.onConnect(onconnect, complete(port));
  };
