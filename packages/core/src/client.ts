import { setupHandlerRegistries, createHandlerRegistries } from "./shinka";
import { defaultRequestTimeout, defaultSerializerRoot } from "./constants";
import { Bus } from "./bus";
import { createEventListeners } from "./factory/event-listeners-bus";

import type {
  BusProps,
  HandlerRegistriesAll,
  FactoriesGeneric,
  ShinkaOnDataEvent,
  ShinkaOnRequest,
  InternalHandlerThisArg,
} from "./types";

export type ClientProps<SO, TO> = BusProps<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, Client<SO, TO>>
>;

export class Client<SO, TO> extends Bus<SO, TO> {
  public onRequest!: ShinkaOnRequest<SO, TO, this>;
  public onDataEvent!: ShinkaOnDataEvent<this>;

  constructor({
    transport,
    serializer = defaultSerializerRoot,
    responseTimeout = defaultRequestTimeout,
  }: ClientProps<SO, TO>) {
    const [transportRegistries, transportFactory] =
      setupHandlerRegistries(transport);
    const [serializerRegistries, serializerFactory] =
      setupHandlerRegistries(serializer);
    const factories: FactoriesGeneric<
      SO,
      TO,
      InternalHandlerThisArg<SO, TO, Client<SO, TO>>
    > = {
      serializer: serializerFactory,
      transport: transportFactory,
    };
    const userRegistries = createHandlerRegistries<SO, TO, this>();
    const registries: HandlerRegistriesAll<SO, TO, any> = {
      serializer: serializerRegistries,
      transport: transportRegistries,
      user: userRegistries,
    };
    const eventListeners = createEventListeners();
    super(factories as any, registries, eventListeners, responseTimeout);
    this.onRequest = userRegistries.onRequest;
    this.dataEvent = userRegistries.onDataEvent;
    Object.freeze(this);
  }
}
