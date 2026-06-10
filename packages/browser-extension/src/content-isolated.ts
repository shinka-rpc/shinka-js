import { Client, TransportClient, ShinkaOnClient } from "@shinka-rpc/core";

// @ts-expect-error: 2304
if (window.chrome === undefined) window.chrome = browser;

export const extensionBusTransport: TransportClient<any, any> =
  (shinkaOn: ShinkaOnClient<any, any>) => (onRawData, onClosed, opts) => {
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

export type CreateIsolatedPairProps<SO, TO> = {
  contentBusTransport: TransportClient<SO, TO>;
  responseTimeout: number;
};

export const createIsolatedPair = ({
  contentBusTransport,
  responseTimeout,
}: CreateIsolatedPairProps<any, any>) => {
  const contentBus = new Client<any, any>({
    transport: contentBusTransport,
    responseTimeout,
  });

  const extensionBus = new Client<any, any>({
    transport: extensionBusTransport,
    responseTimeout,
    restartTimeout: 750,
  });

  return { contentBus, extensionBus };
};
