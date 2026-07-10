import "@shinka-rpc/banshee/banshee-for-browser";
import type { TransportClient } from "@shinka-rpc/core";

export const content2mainTransport = (
  TAG_ONMESSAGE: unknown,
  TAG_SEND: unknown,
) =>
  ((shinkaOn) => (thisArg, onRawData, onClosed, opts) => {
    const _onmessage = (event: MessageEvent) => {
      if (event.source === window && Array.isArray(event.data)) {
        const [tag, payload] = event.data;
        if (tag === TAG_ONMESSAGE) onRawData(payload);
      }
    };
    window.addEventListener("message", _onmessage);
    const close = async () => window.removeEventListener("message", _onmessage);
    const send = async (data: unknown) =>
      window.postMessage([TAG_SEND, data], "*");
    return { send, close, instruction: {} };
  }) as TransportClient<any, any, any>;
