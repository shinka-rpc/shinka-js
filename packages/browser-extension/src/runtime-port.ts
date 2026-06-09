/// <reference types="@types/chrome" />
declare const browser: typeof chrome;

import type { TransportServer } from "@shinka-rpc/core";

export const messagePortTransport: TransportServer<any, any> = (
  shinkaOn,
  connect,
) =>
  chrome.runtime.onConnect.addListener((port) =>
    connect((onRawData, onClosed, opts) => {
      port.onMessage.addListener(onRawData);
      port.onDisconnect.addListener(onClosed);
      const send = port.postMessage.bind(port);
      const close = async () => port.disconnect();
      return { send, close, instruction: {} };
    }),
  );
