/// <reference types="chrome" />
import { TransportClient } from "@shinka-rpc/core";

// @ts-expect-error: 2304
if (!self.chrome) self.chrome = browser;

export type IsolatedExtensionTransportContext = chrome.runtime.Port;

export const extensionTransport = ((shinkaOn) =>
  (thisArg, onRawData, onClosed, opts) => {
    const port = chrome.runtime.connect(chrome.runtime.id);
    port.onMessage.addListener(onRawData);
    port.onDisconnect.addListener(onClosed);
    const send = port.postMessage.bind(port);
    const close = async () => {
      port.onMessage.removeListener(onRawData);
      port.onDisconnect.removeListener(onClosed);
      port.disconnect();
    };
    return { send, close, instruction: { hi: true, bye: true }, context: port };
  }) satisfies TransportClient<
  any,
  undefined,
  void,
  IsolatedExtensionTransportContext
>;
