import { BusRequestKeys, BusEventKeys } from "./const-enums";
import { createHandlerRegistries } from "../../../shinka";

import type { InternalHandlerRegistries } from "../../../types";

export const busHandlerRegistries: InternalHandlerRegistries<any, any, any> =
  createHandlerRegistries();

// === onRequest

busHandlerRegistries.onRequest(BusRequestKeys.PING, () => 1);

// === onDataEvent

busHandlerRegistries.onDataEvent(BusEventKeys.HEARTBEAT, () => {});
busHandlerRegistries.onDataEvent(BusEventKeys.TERMINATE, (_, thisArg) =>
  thisArg.bus.stop(),
);
