import type { TransportClient } from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport-message-port-send";

export const sharedWorkerClient = (create: () => SharedWorker) =>
  ((shinkaOn) => (thisArg, onRawData, onClosed, opts) => {
    if (opts.mode === "not-serialized") throw new Error("invalid mode");
    const instance = create();
    instance.port.onmessage = (ev) => onRawData(ev.data);
    instance.port.onmessageerror = onClosed;
    const close = async () => instance.port.close();
    const send = makeSendRawFn[opts.mode](instance.port);
    return { send, close, instruction: { hi: true, bye: true } };
  }) as TransportClient<any, any, any>;
