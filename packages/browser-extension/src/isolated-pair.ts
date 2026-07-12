import { Client, TransportClient } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { extensionBusTransport } from "./content-isolated";

export type CreateIsolatedPairProps<SO, TO> = {
  contentBusTransport: TransportClient<SO, TO, any>;
  responseTimeout: number;
};

export const createIsolatedPair = ({
  contentBusTransport,
  responseTimeout,
}: CreateIsolatedPairProps<any, any>) => {
  const contentBus = new Client<any, any>({
    outscope,
    transport: contentBusTransport,
    responseTimeout,
  });

  const extensionBus = new Client<any, any>({
    outscope,
    transport: extensionBusTransport,
    responseTimeout,
  });

  return { contentBus, extensionBus };
};
