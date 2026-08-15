/// <reference types="chrome" />
declare const browser: typeof chrome;

import type { TransportServer } from "@shinka-rpc/core";

export const messagePortTransport: TransportServer<any, any, any> = (
  shinkaOn,
  connect,
  eventListeners,
) => {
  const listener = (port: chrome.runtime.Port) =>
    connect((thisArg, onRawData, onClosed, opts) => {
      port.onMessage.addListener((e) => onRawData(e.data));
      port.onDisconnect.addListener(onClosed);
      // @ts-ignore
      const send = port.postMessage.bind(port);
      const close = async () => port.disconnect();
      return { send, close, instruction: { hi: true, bye: true } };
    });

  eventListeners.add("connect", () =>
    chrome.runtime.onConnect.addListener(listener),
  );

  eventListeners.add("predisconnect", () =>
    chrome.runtime.onConnect.removeListener(listener),
  );
};
