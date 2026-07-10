import "@shinka-rpc/banshee/banshee-for-browser";
import type { TransportClient } from "@shinka-rpc/core";

export const clientWebSocketTransport = (create: () => WebSocket) =>
  ((shinkaOn) => async (thisArg, onRawData, onClosed, opts) => {
    // WebSocket *REQUIRE* serialization
    if (opts.mode === "not-serialized") throw new Error("Invalid mode");
    const instance = create();
    if (opts.mode === "binary") instance.binaryType = "arraybuffer";
    instance.addEventListener("message", (e) => onRawData(e.data));
    instance.addEventListener("close", onClosed);
    const close = async () => instance.close();
    const send = (data: any) => instance.send(data);
    await new Promise((resolve, reject) => {
      instance.addEventListener("open", resolve);
      instance.addEventListener("error", reject);
    });
    return { send, close, instruction: {} };
  }) as TransportClient<any, any, any>;
