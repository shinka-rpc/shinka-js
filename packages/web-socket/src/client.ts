import type { TransportInitOpts, ShinkaOn } from "@shinka-rpc/core";

export const WebSocketTransport =
  (createWebSocket: () => WebSocket) =>
  <SO, TA>(shinka: ShinkaOn<SO, any, TA>) =>
  async (
    onRawData: (data: any) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    // WebSocket *REQUIRE* serialization
    if (opts.mode === "not-serialized") throw new Error("Invalid mode");
    const instance = createWebSocket();
    if (opts.mode === "binary") instance.binaryType = "arraybuffer";
    instance.addEventListener("message", onRawData);
    // it looks there are no methods to detect the server is not available
    // instance.addEventListener("close", onClosed);
    const close = async () => instance.close();
    const send = (data: any) => instance.send(data);
    await new Promise((resolve, reject) => {
      instance.addEventListener("open", resolve);
      instance.addEventListener("error", reject);
    });
    return { send, close, instruction: { hi: true, bye: true } };
  };
