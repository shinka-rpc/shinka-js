import type { ClientBus, Transport } from "@shinka-rpc/core";

export const createClientTransport =
  (TAG_ONMESSAGE: unknown, TAG_SEND: unknown) => async (bus: ClientBus) => {
    const _onmessage = (event: MessageEvent) => {
      if (event.source === window && Array.isArray(event.data)) {
        const [tag, payload] = event.data;
        if (tag === TAG_ONMESSAGE) bus.onMessage(payload);
      }
    };
    window.addEventListener("message", _onmessage);
    const close = async () => window.removeEventListener("message", _onmessage);
    const send = async (data: unknown) =>
      window.postMessage([TAG_SEND, data], "*");
    return { send, close } as Transport;
  };
