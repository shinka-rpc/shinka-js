import type { TransportClient, SerializerRoot } from "./types";
import { Hub, type HubOptions, type HubConnectProps } from "./hub";
import {
  defaultExclusiveLock,
  defaultSerializerRoot,
  defaultRequestTimeout,
} from "./defaults";
import { setupHandlerRegistries } from "./shinka";

export type PoolProps<SO, TO> = HubOptions<SO, TO> & {
  transport: TransportClient<SO, TO, any>;
  serializer?: SerializerRoot<SO, TO, any>;
};

export class Pool<SO, TO> {
  #hub!: Hub<SO, TO>;
  #connect!: HubConnectProps<SO, TO>;

  constructor({
    outscope,
    transport,
    serializer = defaultSerializerRoot,
    limon = null,
    lock = defaultExclusiveLock,
    responseTimeout = defaultRequestTimeout,
  }: PoolProps<SO, TO>) {
    this.#hub = new Hub({ outscope, limon, lock, responseTimeout });
    this.#connect = {
      transport: setupHandlerRegistries(transport),
      serializer: setupHandlerRegistries(serializer),
    };
  }
}
