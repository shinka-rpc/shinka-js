import { createHandlerRegistries } from "./shinka";
import { defaultRequestTimeout, defaultSerializerRoot } from "./constants";
import { Bus } from "./bus";
import { createEventListeners } from "./factory/event-listeners";

import type {
  ClientProps,
  HandlerRegistriesAll,
  FactoriesGeneric,
  ShinkaOnDataEvent,
  ShinkaOnRequest,
  InternalHandlerThisArg,
} from "./types";

export class Client<SO, TO> extends Bus<SO, TO> {
  public onRequest!: ShinkaOnRequest<SO, TO, this>;
  public onDataEvent!: ShinkaOnDataEvent<this>;

  constructor({
    transport,
    serializer = defaultSerializerRoot,
    responseTimeout = defaultRequestTimeout,
  }: ClientProps<SO, TO, any>) {
    const transportRegistries = createHandlerRegistries<SO, TO, any>();
    const transportFactory = transport(transportRegistries);
    const serializerRegistries = createHandlerRegistries<SO, TO, any>();
    const serializerFactory = serializer(serializerRegistries);
    const factories: FactoriesGeneric<
      SO,
      TO,
      InternalHandlerThisArg<SO, TO, this>
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
    super(
      factories as any,
      registries,
      createEventListeners(),
      responseTimeout,
    );
    this.onRequest = userRegistries.onRequest;
    this.dataEvent = userRegistries.onDataEvent;
    Object.freeze(this);
  }
}
