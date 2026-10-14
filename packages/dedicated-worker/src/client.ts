import type { TransportClient } from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport/message-port-send";

export const dedicatedWorkerClient = (create: () => Worker) =>
  ((shinkaOn) => (thisArg, onRawData, onClosed, opts) => {
    if (opts.mode === "not-serialized") throw new Error("invalid mode");
    const instance = create();
    instance.onmessage = (ev) => onRawData(ev.data);
    instance.onmessageerror = onClosed;
    const close = async () => instance.terminate();
    const send = makeSendRawFn[opts.mode](instance);
    return {
      send,
      close,
      instruction: { hi: true, bye: true },
      context: instance,
    };
  }) satisfies TransportClient<any, undefined, void, Worker>;
