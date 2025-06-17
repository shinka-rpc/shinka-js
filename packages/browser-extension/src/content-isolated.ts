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

/**
 * Creates a pair of isolated buses for content script and extension communication.
 * This function sets up two ClientBus instances with proper configuration for
 * isolated communication between content scripts and the extension.
 *
 * @param props - Configuration options for the isolated pair
 * @param props.contentBusFactory - Factory function for creating the content bus
 * @param props.responseTimeout - Timeout for request responses in milliseconds
 * @param props.contentRegistry - Optional registry for content bus handlers
 * @param props.extensionRegistry - Optional registry for extension bus handlers
 * @returns An object containing the configured content and extension buses
 *
 * @example
 * ```typescript
 * const { contentBus, extensionBus } = createIsolatedPair({
 *   contentBusFactory: createContentBusFactory(),
 *   responseTimeout: 5000,
 *   contentRegistry: {
 *     // Content bus handlers
 *   },
 *   extensionRegistry: {
 *     // Extension bus handlers
 *   }
 * });
 * ```
 */
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
