import type { TransportClient } from "@shinka-rpc/core";

export const clientWebSocketTransport = (create: () => WebSocket) =>
  ((shinkaOn) => async (thisArg, onRawData, onClosed, opts) => {
    // WebSocket *REQUIRE* serialization
    if (opts.mode === "not-serialized") throw new Error("Invalid mode");
    const instance = create();
    const instanceAddEventListener = instance.addEventListener.bind(instance);
    instance.binaryType = "arraybuffer";
    instanceAddEventListener("message", (e) => onRawData(e.data));
    instanceAddEventListener("close", onClosed);
    const close = async () => instance.close();
    const send = (data: any) => instance.send(data);
    await new Promise((resolve, reject) => {
      instanceAddEventListener("open", resolve);
      instanceAddEventListener("error", reject);
    });
    return { send, close, instruction: {}, context: instance };
  }) satisfies TransportClient<any, undefined, void, WebSocket>;
