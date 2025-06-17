import type { FactoryData, ClientBus } from "@shinka-rpc/core";

/**
 * Creates a factory data object for handling communication with a Shared Worker.
 * This function sets up message handling through the worker's port and provides methods for sending messages and closing the connection.
 *
 * @param instance - The Shared Worker instance to communicate with
 * @param bus - The client bus instance that handles message processing
 * @param binary - Optional flag to enable binary message transfer. When true, messages are sent as Uint8Array
 * @returns A FactoryData object containing:
 *   - send: Function to send messages to the worker's port (either as string or binary)
 *   - close: Async function to close the worker's port connection
 *
 * @example
 * ```typescript
 *  const factory: FactoryClient<ClientBus> = async (bus) =>
 *    SharedWorker2FactoryData(
 *      new SharedWorker(new URL("../server", import.meta.url)),
 *      bus,
 *    );
 *
 *  export const myBus = new ClientBus({ factory, serializer });
 * ```
 */
export const SharedWorker2FactoryData = (
  instance: SharedWorker,
  bus: ClientBus,
  binary = false,
) => {
  const _onmessage = (e: MessageEvent) => bus.onMessage(e.data);
  instance.port.onmessage = _onmessage;
  const close = async () => instance.port.close();
  const send = binary
    ? (data: Uint8Array) => instance.port.postMessage(data, [data.buffer])
    : (data: string) => instance.port.postMessage(data);
  return { send, close } as FactoryData;
};
