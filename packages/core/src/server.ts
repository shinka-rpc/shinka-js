import { delegate, type DelegateType } from "@shinka-rpc/util";

import {
  Hub,
  type HubOptions,
  type HandlerRegistriesHub,
  type HubConnectProps,
} from "./hub";

import {
  defaultRequestTimeout,
  defaultExchangeTimeoutThrashold,
  defaultSerializerRoot,
} from "./constants";

import type { Bus } from "./bus";
import type {
  ShinkaOnRequest,
  ShinkaOnDataEvent,
  ManageEventListener,
  SerializerRoot,
  InternalHandlerThisArg,
  SerializerFactory,
  TransportServer,
  TransportFactory,
  Factories,
  ShinkaOn,
  TransportConnectFn,
} from "./types";

import { setupHandlerRegistries } from "./shinka";

type ConnectFnThis<SO, TO> = [
  (props: HubConnectProps<SO, TO>) => Promise<Bus<SO, TO>>,
  HandlerRegistriesHub<SO, TO>,
  SerializerFactory<SO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
];

function connectFn<SO, TO>(
  this: ConnectFnThis<SO, TO>,
  transport: TransportFactory<TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
) {
  const [connect, handlerRegistries, serializer] = this;
  const factories: Factories<SO, TO> = { transport, serializer };
  const props: HubConnectProps<SO, TO> = { factories, handlerRegistries };
  connect(props);
}

type TransportHelperThis<SO, TO> = [
  TransportServer<SO, TO>,
  TransportConnectFn<TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
];

function transportHelper<SO, TO>(
  this: TransportHelperThis<SO, TO>,
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
) {
  return this[0](shinkaOn, this[1]);
}

const connectDefault = () => {
  throw new Error("Server is not ready!");
};

export type ServerOptions<SO, TO> = HubOptions & {
  transport: TransportServer<SO, TO>;
  serializer?: SerializerRoot<
    SO,
    TO,
    InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
  >;
};

export class Server<SO, TO> {
  private hub!: Hub<SO, TO>;
  private connectDelegate!: DelegateType<
    TransportConnectFn<TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>
  >;

  public onRequest!: ShinkaOnRequest<SO, TO, Bus<SO, TO>>;
  public onDataEvent!: ShinkaOnDataEvent<Bus<SO, TO>>;
  public addEventListener!: ManageEventListener<Bus<SO, TO>>;
  public removeEventListener!: ManageEventListener<Bus<SO, TO>>;

  public extra!: Record<string | symbol, any>;

  constructor({
    transport: transportServerFactory,
    serializer: serializerRoot = defaultSerializerRoot,
    responseTimeout = defaultRequestTimeout,
    exchangeTimeouts = {
      value: 0,
      thrashold: defaultExchangeTimeoutThrashold,
    },
  }: ServerOptions<SO, TO>) {
    this.hub = new Hub({ responseTimeout, exchangeTimeouts });
    this.connectDelegate = delegate(
      connectDefault as TransportConnectFn<
        TO,
        InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
      >,
    );
    const [transportRegistries] = setupHandlerRegistries(
      (transportHelper<SO, TO>).bind([
        transportServerFactory,
        this.connectDelegate.call,
      ]),
    );

    const [serializerRegistries, serializerFactory] =
      setupHandlerRegistries(serializerRoot);

    const handlerRegistries: HandlerRegistriesHub<SO, TO> = {
      transport: transportRegistries,
      serializer: serializerRegistries,
    };

    const connect = (connectFn<SO, TO>).bind([
      this.hub.connect,
      handlerRegistries,
      serializerFactory,
    ]);

    this.connectDelegate.set(connect);

    this.onDataEvent = this.hub.onDataEvent;
    this.onRequest = this.hub.onRequest;
    this.addEventListener = this.hub.addEventListener;
    this.removeEventListener = this.hub.removeEventListener;
    this.extra = this.hub.extra;

    Object.freeze(this);
  }

  public get size() {
    return this.hub.size;
  }
}
