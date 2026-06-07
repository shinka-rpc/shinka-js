import { BusRequestKeys, BusEventKeys } from "../constants";
import { createHandlerRegistries } from "../shinka";
import { scheduler } from "../scheduler";

import type { BusHandlerRegistries } from "../types";

export const busHandlerRegistries: BusHandlerRegistries<any, any, any> =
  createHandlerRegistries();

// === onRequest

busHandlerRegistries.onRequest(BusRequestKeys.PING, () => 0);

// === onDataEvent

busHandlerRegistries.onDataEvent(BusEventKeys.I_AM_ALIVE, () => 0);
busHandlerRegistries.onDataEvent(BusEventKeys.TERMINATE, (_, thisArg) =>
  thisArg.bus.stop(),
);

busHandlerRegistries.onDataEvent(
  BusEventKeys.EXCHANGE,
  (value: number, { bus, shinka, vars, exchangeTimeouts }) => {
    vars.externalTimeout = value;
    if (vars.schedulerTimeoutId !== null) clearTimeout(vars.schedulerTimeoutId);
    scheduler(bus, shinka, vars, exchangeTimeouts);
  },
);
