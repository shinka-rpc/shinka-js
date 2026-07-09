import { defaultRequestTimeout, defaultSerializerRoot } from "./defaults";
import { Bus } from "./bus";
import { setupHandlerRegistries, createHandlerRegistries } from "./shinka";
import { createEventListeners } from "./factory/event-listeners-bus";
import type { BusProps, ShinkaOnDataEvent, ShinkaOnRequest } from "./types";

export class Client<SO, TO> extends Bus<SO, TO> {
  public onRequest!: ShinkaOnRequest<SO, TO, this>;
  public onDataEvent!: ShinkaOnDataEvent<this>;

  constructor({
    transport,
    serializer = defaultSerializerRoot,
    limon = null,
    responseTimeout = defaultRequestTimeout,
  }: BusProps<SO, TO>) {
    const transportRF = setupHandlerRegistries(transport);
    const serializerRF = setupHandlerRegistries(serializer);
    const limonRF = limon && setupHandlerRegistries(limon);
    const userRegistries = createHandlerRegistries<SO, TO, this>();
    const eventListeners = createEventListeners();
    super(
      transportRF,
      serializerRF,
      limonRF,
      userRegistries as any,
      eventListeners,
      responseTimeout,
    );
    this.onRequest = userRegistries.onRequest;
    this.dataEvent = userRegistries.onDataEvent;
    Object.freeze(this);
  }
}
