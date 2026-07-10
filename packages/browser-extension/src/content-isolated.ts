import "@shinka-rpc/banshee/banshee-for-browser";
import { TransportClient } from "@shinka-rpc/core";

// @ts-expect-error: 2304
if (!window.chrome) window.chrome = browser;

export const extensionBusTransport: TransportClient<any, any, any> =
  (shinkaOn) => (thisArg, onRawData, onClosed, opts) => {
    const port = chrome.runtime.connect(chrome.runtime.id);
    port.onMessage.addListener(onRawData);
    port.onDisconnect.addListener(onClosed);
    const send = async (data: unknown) => port.postMessage(data);
    const close = async () => {
      port.onMessage.removeListener(onRawData);
      port.onDisconnect.removeListener(onClosed);
      port.disconnect();
    };
    return { send, close, instruction: {} };
  };
