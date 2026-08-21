import {
  Client,
  type TransportClient,
  type SerializerRoot,
  type BusProps,
  CompleteFn,
} from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import {
  extensionTransport,
  type IsolatedExtensionTransportContext,
} from "./content-isolated";

export type CreateIsolatedPairProps<SO, TO> = {
  contentBusTransport: TransportClient<SO, TO, any, any>;
  responseTimeout: number;
  serializer?: SerializerRoot<SO, TO, any>;
  completeExtension?: CompleteFn<SO, TO, IsolatedExtensionTransportContext>;
};

export const createIsolatedPair = ({
  contentBusTransport,
  responseTimeout,
  serializer,
  completeExtension,
}: CreateIsolatedPairProps<any, any>) => {
  const contentBus = new Client<any, any, null>({
    outscope,
    transport: contentBusTransport,
    responseTimeout,
  });

  const props: BusProps<any, any, IsolatedExtensionTransportContext> = {
    serializer,
    outscope,
    transport: extensionTransport,
    complete: completeExtension,
    responseTimeout,
  };

  const extensionBus = new Client(props);

  return { contentBus, extensionBus };
};
