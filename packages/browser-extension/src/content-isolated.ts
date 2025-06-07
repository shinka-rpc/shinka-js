import {
  ClientBus,
  FactoryClient,
  Registry,
  registerBeforeUnload,
} from "@shinka-rpc/core";

// @ts-expect-error: 2304
if (window.chrome === undefined) window.chrome = browser;

export const extensionBusFactory: FactoryClient<ClientBus> = async (bus) => {
  const port = chrome.runtime.connect(chrome.runtime.id);
  port.onMessage.addListener(bus.onMessage);
  port.onDisconnect.addListener(bus.maybeRestart);
  const send = async (data: unknown) => port.postMessage(data);
  const close = async () => port.disconnect();
  return { send, close };
};

export type CreateIsolatedPairProps = {
  contentBusFactory: FactoryClient<ClientBus>;
  responseTimeout: number;
  contentRegistry?: Registry<ClientBus>;
  extensionRegistry?: Registry<ClientBus>;
};

export const createIsolatedPair = ({
  contentBusFactory,
  responseTimeout,
  contentRegistry = {},
  extensionRegistry = {},
}: CreateIsolatedPairProps) => {
  const contentBus = new ClientBus({
    factory: contentBusFactory,
    responseTimeout,
    sayHello: false,
    registry: contentRegistry,
  });

  const extensionBus = new ClientBus({
    factory: extensionBusFactory,
    responseTimeout,
    sayHello: false,
    registry: extensionRegistry,
    restartTimeout: 750,
  });

  registerBeforeUnload(extensionBus);

  return { contentBus, extensionBus };
};
