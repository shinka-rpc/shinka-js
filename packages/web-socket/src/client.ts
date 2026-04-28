import type { ClientBus } from "@shinka-rpc/core";

export const WebSocketTransport = async (
  instance: WebSocket,
  bus: ClientBus,
) => {
  const _onmessage = (e: MessageEvent) => bus.onMessage(e.data);
  instance.addEventListener("message", _onmessage);
  instance.addEventListener("close", bus.maybeRestart);
  const close = async () => instance.close();
  const send = (data: BufferSource) => instance.send(data);
  await new Promise((resolve, reject) => {
    instance.addEventListener("open", resolve);
    instance.addEventListener("error", reject);
  });
  return { send, close, instruction: {} };
};
