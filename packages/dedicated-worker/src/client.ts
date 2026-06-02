import type { Transport, ClientBus, MessageDataEvent } from "@shinka-rpc/core";

export const DedicatedWorker2Transport = (
  instance: Worker,
  bus: ClientBus,
  binary = false,
) => {
  const _onmessage = (e: MessageDataEvent<any>) => bus.onMessage(e.data);
  instance.onmessage = _onmessage;
  const close = async () => instance.terminate();
  const send = binary
    ? (data: Uint8Array) => instance.postMessage(data, [data.buffer])
    : (data: string) => instance.postMessage(data);
  return { send, close, instruction: {} } as Transport;
};
