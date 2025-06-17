import type { ClientBus } from "@shinka-rpc/core";

/**
 * Creates a WebSocket-based factory data object for a ClientBus instance.
 * This function sets up WebSocket event listeners and manages the connection lifecycle.
 *
 * @param instance - The WebSocket instance to use for communication
 * @param bus - The ClientBus instance to connect to the WebSocket
 * @returns A Promise that resolves to an object containing send and close functions
 *
 * @example
 * ```typescript
 * const ws = new WebSocket('ws://example.com');
 * const factoryData = await WebSocketFactoryData(ws, clientBus);
 *
 * // Use the factory data to send messages
 * factoryData.send(data);
 *
 * // Close the connection when done
 * await factoryData.close();
 * ```
 */
export const WebSocketFactoryData = async (
  instance: WebSocket,
  bus: ClientBus,
) => {
  const _onmessage = (e: MessageEvent) => bus.onMessage(e.data);
  instance.addEventListener("message", _onmessage);
  instance.addEventListener("close", bus.maybeRestart);
  const close = async () => instance.close();
  const send = (data: Uint8Array) => instance.send(data);
  await new Promise((resolve, reject) => {
    instance.addEventListener("open", resolve);
    instance.addEventListener("error", reject);
  });
  return { send, close };
};
