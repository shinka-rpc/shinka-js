import { Client, TransportClient } from "@shinka-rpc/core";
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
    transport: contentBusTransport,
    responseTimeout,
  });

  const extensionBus = new Client<any, any>({
    transport: extensionBusTransport,
    responseTimeout,
  });

  return { contentBus, extensionBus };
};
