import { createHandlerRegistries } from "./shinka";
import { defaultRequestTimeout, defaultSerializerRoot } from "./constants";
import { CommonBus } from "./common";
import { createEventListeners } from "./factory/event-listeners";

import type {
  ClientBusProps,
  HandlerRegistriesAll,
  Factories,
  ShinkaOnDataEvent,
  ShinkaOnRequest,
} from "./types";

export class ClientBus<SO, TO> extends CommonBus<SO, TO> {
  public onRequest!: ShinkaOnRequest<SO, TO, this>;
  public onDataEvent!: ShinkaOnDataEvent<this>;

  constructor({
    transport,
    serializer = defaultSerializerRoot,
    responseTimeout = defaultRequestTimeout,
  }: ClientBusProps<SO, TO, any>) {
    const [transportFactory, transportRegistries] = transport();
    const [serializerFactory, serializerRegistries] = serializer();
    const factories: Factories<SO, TO> = {
      serializer: serializerFactory,
      transport: transportFactory,
    };
    const userRegistries = createHandlerRegistries<SO, TO, this>();
    const registries: HandlerRegistriesAll<SO, TO, any> = {
      serializer: serializerRegistries,
      transport: transportRegistries,
      user: userRegistries,
    };
    super(factories, registries, createEventListeners(), responseTimeout);
    this.onRequest = userRegistries.onRequest;
    this.dataEvent = userRegistries.onDataEvent;
    Object.freeze(this);
  }
}
