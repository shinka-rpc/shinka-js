import type { TransportInitOpts, ShinkaOnClient } from "@shinka-rpc/core";

export const clientWebSocketTransport =
  (create: () => WebSocket) =>
  <SO>(shinka: ShinkaOnClient<SO, any>) =>
  async (
    onRawData: (data: any) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    // WebSocket *REQUIRE* serialization
    if (opts.mode === "not-serialized") throw new Error("Invalid mode");
    const instance = create();
    if (opts.mode === "binary") instance.binaryType = "arraybuffer";
    instance.addEventListener("message", onRawData);
    instance.addEventListener("close", onClosed);
    const close = async () => instance.close();
    const send = (data: any) => instance.send(data);
    await new Promise((resolve, reject) => {
      instance.addEventListener("open", resolve);
      instance.addEventListener("error", reject);
    });
    return { send, close, instruction: {} };
  };
