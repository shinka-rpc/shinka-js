import type { TransportServer } from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport/message-port-send";

export const sharedWorkerServer = ((shinkaOn, connect, eventListeners) => {
  const swEventHandler = (connectEvent: Event) => {
    const port = (connectEvent as any as MessageEvent)
      .source as any as MessagePort;
    const close = async () => port.close();
    connect((thisArg, onRawData, onClosed, opts) => {
      if (opts.mode === "not-serialized") throw new Error("invalid mode");
      const send = makeSendRawFn[opts.mode](port);
      port.onmessage = (ev) => onRawData(ev.data);
      port.onmessageerror = onClosed;
      return { send, close, instruction: {}, context: port };
    });
  };
  eventListeners.add("started", () =>
    addEventListener("connect", swEventHandler),
  );
  eventListeners.add("stopping", () =>
    removeEventListener("connect", swEventHandler),
  );
}) satisfies TransportServer<unknown, undefined, void, MessagePort>;
