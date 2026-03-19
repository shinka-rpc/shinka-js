import type { ClientBus } from "@shinka-rpc/core";

export const DedicatedWorkerServer = (binary = false, targetOrigin = "/") => {
  const send = binary
    ? (data: Uint8Array) => postMessage(data, targetOrigin, [data.buffer])
    : (data: string) => postMessage(data, targetOrigin);
  const close = async () => {};
  return { send, close };
};

export const createOnMessage = (bus: ClientBus) => (e: MessageEvent) =>
  bus.onMessage(e.data);
