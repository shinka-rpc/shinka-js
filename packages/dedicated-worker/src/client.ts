import type { FactoryData, ClientBus } from "@shinka-rpc/core";

/**
 * Creates a factory data object for handling communication with a dedicated Web Worker.
 * This function sets up message handling and provides methods for sending messages and closing the worker.
 *
 * @param instance - The Web Worker instance to communicate with
 * @param bus - The client bus instance that handles message processing
 * @param binary - Optional flag to enable binary message transfer. When true, messages are sent as Uint8Array
 * @returns A FactoryData object containing:
 *   - send: Function to send messages to the worker (either as string or binary)
 *   - close: Async function to terminate the worker
 *
 * @example
 * ```typescript
 * const worker = new Worker('worker.js');
 * const factoryData = DedicatedWorker2FactoryData(worker, clientBus);
 * // Send a message
 * factoryData.send('Hello Worker');
 * // Close the worker when done
 * await factoryData.close();
 * ```
 */
export const DedicatedWorker2FactoryData = (
  instance: Worker,
  bus: ClientBus,
  binary = false,
) => {
  const _onmessage = (e: MessageEvent) => bus.onMessage(e.data);
  instance.onmessage = _onmessage;
  const close = async () => instance.terminate();
  const send = binary
    ? (data: Uint8Array) => instance.postMessage(data, [data.buffer])
    : (data: string) => instance.postMessage(data);
  return { send, close } as FactoryData;
};
