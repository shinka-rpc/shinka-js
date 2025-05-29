import type { ServerBus, CommonBus } from "@shinka-rpc/core";

export const SharedWorkerServer = (server: ServerBus) => (e: MessageEvent) => {
  const onconnect = async (bus: CommonBus) => {
    const port = e.source as any as MessagePort;
    const _onmessage = (e: MessageEvent) => bus.onMessage(e.data);
    port.onmessage = _onmessage;
    const send = (data: Uint8Array) => port.postMessage(data, [data.buffer]);
    const close = async () => port.close();
    port.start();
    return { send, close };
  };
  server.onConnect(onconnect);
};
