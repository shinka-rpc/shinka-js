import { createHandlerRegistries } from "./shinka";
import { defaultRequestTimeout, defaultSerializerRoot } from "./constants";
import { Bus } from "./bus";
import { createEventListeners } from "./factory/event-listeners";

import type {
  ClientBusProps,
  HandlerRegistriesAll,
  Factories,
  ShinkaOnDataEvent,
  ShinkaOnRequest,
} from "./types";

export class ClientBus<SO, TO> extends Bus<SO, TO> {
  public onRequest!: ShinkaOnRequest<SO, TO, this>;
  public onDataEvent!: ShinkaOnDataEvent<this>;

  constructor({
    transport,
    serializer = defaultSerializerRoot,
    responseTimeout = defaultRequestTimeout,
  }: ClientBusProps<SO, TO, any>) {
    const transportRegistries = createHandlerRegistries<SO, TO, any>();
    const transportFactory = transport(transportRegistries);
    const serializerRegistries = createHandlerRegistries<SO, TO, any>();
    const serializerFactory = serializer(serializerRegistries);
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
