import type { ServerBus, CommonBus } from "@shinka-rpc/core";

/**
 * Creates a message event handler for a Shared Worker server.
 * This function sets up communication channels for each client connection to the Shared Worker.
 *
 * @param server - The server bus instance that manages client connections
 * @param binary - Optional flag to enable binary message transfer. When true, messages are sent as Uint8Array
 * @returns A function that handles MessageEvent from client connections, which:
 *   - Creates a communication channel for each connected client
 *   - Sets up message handling through the client's port
 *   - Provides methods for sending messages and closing the connection
 *
 * @example
 * ```typescript
 * // Let typescript know about the onconnect event
 * declare let onconnect: (event: MessageEvent) => void;
 *
 * // In your Shared Worker file
 * const server = new ServerBus();
 *
 * // Set up the server to handle connections
 * onconnect = SharedWorkerServer(server);
 *
 * // Handle client messages
 * server.onRequest(
 *   "myRequest",
 *   (args) => {
 *     // Process client's request
 *   }
 * );
 * ```
 */
export const SharedWorkerServer =
  (server: ServerBus, binary = false) =>
  (e: MessageEvent) => {
    const factory = async (bus: CommonBus) => {
      const port = e.source as any as MessagePort;
      const _onmessage = (e: MessageEvent) => bus.onMessage(e.data);
      port.onmessage = _onmessage;
      const send = binary
        ? (data: Uint8Array) => port.postMessage(data, [data.buffer])
        : (data: string) => port.postMessage(data);
      const close = async () => port.close();
      port.start();
      return { send, close };
    };
    server.connect({ factory });
  };
