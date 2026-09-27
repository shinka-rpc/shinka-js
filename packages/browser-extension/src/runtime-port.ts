/// <reference types="chrome" />
declare const browser: typeof chrome;

import type { TransportServer } from "@shinka-rpc/core";

export type ExtensionTransportContext = chrome.runtime.Port;

export const messagePortTransport: TransportServer<
  any,
  undefined,
  void,
  ExtensionTransportContext
> = (shinkaOn, connect, eventListeners) => {
  const listener = (port: chrome.runtime.Port) =>
    connect((thisArg, onRawData, onClosed, opts) => {
      port.onMessage.addListener(onRawData);
      port.onDisconnect.addListener(onClosed);
      const send = port.postMessage.bind(port);
      const close = async () => port.disconnect();
      return {
        send,
        close,
        instruction: { hi: true, bye: true },
        context: port,
      };
    });

  eventListeners.add("started", () =>
    chrome.runtime.onConnect.addListener(listener),
  );

  eventListeners.add("stopping", () =>
    chrome.runtime.onConnect.removeListener(listener),
  );
};
