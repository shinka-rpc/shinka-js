import type { ClientBus } from "@shinka-rpc/core";

/**
 * Creates a server implementation for a Dedicated Web Worker.
 * This function sets up message handling and provides send/close functionality
 * for communication with the main thread.
 *
 * @param binary - Whether to use binary message format (defaults to false)
 * @param targetOrigin - The target origin for postMessage (defaults to "/")
 * @returns An object containing send and close functions for the worker
 *
 * @example
 * ```typescript
 * // In a Web Worker
 * const server = DedicatedWorkerServer();
 *
 * // Send a message to the main thread
 * server.send(data);
 *
 * // Close the worker when done
 * await server.close();
 * ```
 */
export const DedicatedWorkerServer = (binary = false, targetOrigin = "/") => {
  const send = binary
    ? (data: Uint8Array) => postMessage(data, targetOrigin, [data.buffer])
    : (data: string) => postMessage(data, targetOrigin);
  const close = async () => {};
  return { send, close };
};

export const createOnMessage = (bus: ClientBus) => (e: MessageEvent) =>
  bus.onMessage(e.data);
