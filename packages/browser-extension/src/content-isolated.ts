import { ClientBus, TransportFactory } from "@shinka-rpc/core";

// @ts-expect-error: 2304
if (window.chrome === undefined) window.chrome = browser;

export const extensionBusTransport: TransportFactory<ClientBus> = async (
  bus,
  opts,
) => {
  const port = chrome.runtime.connect(chrome.runtime.id);
  port.onMessage.addListener(bus.onMessage);
  port.onDisconnect.addListener(bus.maybeRestart);
  const send = async (data: unknown) => port.postMessage(data);
  const close = async () => port.disconnect();
  return { send, close, instruction: {} };
};

export type CreateIsolatedPairProps = {
  contentBusTransport: TransportFactory<ClientBus>;
  responseTimeout: number;
};

export const createIsolatedPair = ({
  contentBusTransport,
  responseTimeout,
}: CreateIsolatedPairProps) => {
  const contentBus = new ClientBus({
    transport: contentBusTransport,
    responseTimeout,
  });

  const extensionBus = new ClientBus({
    transport: extensionBusTransport,
    responseTimeout,
    restartTimeout: 750,
  });

  return { contentBus, extensionBus };
};
