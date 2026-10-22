/// <reference lib="webworker" />

import type { TransportClient } from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport/message-port-send";

export const dedicatedWorkerServer: TransportClient<any, any, any, null> =
  (shinkaOn) => (thisArg, onRawData, onClosed, opts) => {
    if (opts.mode === "not-serialized") throw new Error("invalid mode");
    const messageHandler = (event: MessageEvent) => onRawData(event.data);
    addEventListener("message", messageHandler);
    addEventListener("messageerror", onClosed);
    const send = makeSendRawFn[opts.mode](self);
    const _close = async () => {
      removeEventListener("message", messageHandler);
      removeEventListener("messageerror", onClosed);
      close();
    };
    return { send, close: _close, instruction: {}, context: null };
  };
