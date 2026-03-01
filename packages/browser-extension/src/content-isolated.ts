import {
  ClientBus,
  TransportFactory,
  // Registry,
  registerBeforeUnload,
} from "@shinka-rpc/core";

// @ts-expect-error: 2304
if (window.chrome === undefined) window.chrome = browser;

export const extensionBusTransport: TransportFactory<ClientBus> = async (
  bus,
) => {
  const port = chrome.runtime.connect(chrome.runtime.id);
  port.onMessage.addListener(bus.onMessage);
  port.onDisconnect.addListener(bus.maybeRestart);
  const send = async (data: unknown) => port.postMessage(data);
  const close = async () => port.disconnect();
  return { send, close };
};

export type CreateIsolatedPairProps = {
  contentBusTransport: TransportFactory<ClientBus>;
  responseTimeout: number;
  // contentRegistry?: Registry<ClientBus>;
  // extensionRegistry?: Registry<ClientBus>;
};

export const createIsolatedPair = ({
  contentBusTransport,
  responseTimeout,
  // contentRegistry = {},
  // extensionRegistry = {},
}: CreateIsolatedPairProps) => {
  const contentBus = new ClientBus({
    transport: contentBusTransport,
    responseTimeout,
    // sayHello: false,
    // registry: contentRegistry,
  });

  const extensionBus = new ClientBus({
    transport: extensionBusTransport,
    responseTimeout,
    // sayHello: false,
    // registry: extensionRegistry,
    restartTimeout: 750,
  });

  registerBeforeUnload(extensionBus);

  return { contentBus, extensionBus };
};
