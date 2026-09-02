import { defaultSerializerRoot, defaultExclusiveLock } from "./defaults";
import { Bus } from "./bus";
import { setupHandlerRegistries, createHandlerRegistries } from "./shinka";
import { createEventListeners } from "./factory/event-listeners-bus";
import type { ShinkaOnDataEvent, ShinkaOnRequest, ClientProps } from "./types";

export class Client<SO = any, TO = any, TC = any> extends Bus<SO, TO, TC> {
  public onRequest: ShinkaOnRequest<SO, TO, this>;
  public onDataEvent: ShinkaOnDataEvent<this>;

  constructor({
    outscope,
    transport,
    serializer = defaultSerializerRoot,
    lock = defaultExclusiveLock,
    limon = null,
    responseTimeout,
    complete,
  }: ClientProps<SO, TO, TC>) {
    const transportRF = setupHandlerRegistries(transport);
    const serializerRF = setupHandlerRegistries(serializer);
    const limonRF = limon && setupHandlerRegistries(limon);
    const userRegistries = createHandlerRegistries<SO, TO, this>();
    const eventListeners = createEventListeners();
    super(
      outscope,
      transportRF,
      serializerRF,
      limonRF,
      userRegistries as any,
      eventListeners,
      lock,
      responseTimeout,
      complete,
    );
    this.onRequest = userRegistries.onRequest;
    this.onDataEvent = userRegistries.onDataEvent;
    Object.freeze(this);
  }
}
