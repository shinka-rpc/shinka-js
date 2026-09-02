import type { TransportClient } from "@shinka-rpc/core";

export const content2mainTransport = (
  TAG_ONMESSAGE: unknown,
  TAG_SEND: unknown,
) =>
  ((shinkaOn) => (thisArg, onRawData, onClosed, opts) => {
    const _onmessage = (event: MessageEvent) => {
      if (event.source === window && Array.isArray(event.data)) {
        const { 0: tag, 1: payload } = event.data;
        if (tag === TAG_ONMESSAGE) onRawData(payload);
      }
    };
    window.addEventListener("message", _onmessage);
    const close = async () => window.removeEventListener("message", _onmessage);
    const send = async (data: unknown) =>
      window.postMessage([TAG_SEND, data], "*");
    return { send, close, instruction: {}, context: null };
  }) satisfies TransportClient<any, undefined, void, null>;
