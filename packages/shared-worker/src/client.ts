import type { TransportClient } from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport/message-port-send";

export const sharedWorkerClient = (create: () => SharedWorker) =>
  ((shinkaOn) => (thisArg, onRawData, onClosed, opts) => {
    if (opts.mode === "not-serialized") throw new Error("invalid mode");
    const instance = create();
    const instancePortAddEventListener = instance.port.addEventListener.bind(
      instance.port,
    );
    instancePortAddEventListener("message", (ev) => onRawData(ev.data));
    instancePortAddEventListener("messageerror", onClosed);
    const close = async () => instance.port.close();
    const send = makeSendRawFn[opts.mode](instance.port);
    return {
      send,
      close,
      instruction: { hi: true, bye: true },
      context: instance,
    };
  }) satisfies TransportClient<any, undefined, any, SharedWorker>;
