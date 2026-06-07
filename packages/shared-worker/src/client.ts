import type { TransportInitOpts, ShinkaOn } from "@shinka-rpc/core";

export const SharedWorkerTransport =
  (createSharedWorker: () => SharedWorker) =>
  <SO, TA>(shinka: ShinkaOn<SO, any, TA>) =>
  async (
    onRawData: (data: any) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    // SharedWorker *REQUIRE* serialization
    if (opts.mode === "not-serialized") throw new Error("Invalid mode");
    const instance = createSharedWorker();
    instance.port.onmessage = onRawData;
    instance.port.onmessageerror = onClosed;
    const close = async () => instance.port.close();
    const send =
      opts.mode === "binary"
        ? (data: Uint8Array) => instance.port.postMessage(data, [data.buffer])
        : (data: string) => instance.port.postMessage(data);
    return { send, close, instruction: {} };
  };
