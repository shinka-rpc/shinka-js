import type { FactoryData, ClientBus } from "@shinka-rpc/core";

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
