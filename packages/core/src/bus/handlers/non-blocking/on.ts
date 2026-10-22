import { NBEventKeys } from "./const-enums";
import { NBAcquire } from "../../const-enums";
import { createHandlerRegistries } from "../../../shinka";

import type { NBHandlerRegistries } from "../../../types";

export const nbHandlerRegistries: NBHandlerRegistries<any, any, any> =
  createHandlerRegistries();

// === onRequest

// === onDataEvent

nbHandlerRegistries.onDataEvent(
  NBEventKeys.ACQUIRE,
  ([target, timeout, ...nonces]: [NBAcquire, number, ...number[]], thisArg) =>
    thisArg.lock.on.acquire(thisArg, target, timeout, nonces),
);

nbHandlerRegistries.onDataEvent(NBEventKeys.ACCEPT, (_, thisArg) =>
  thisArg.lock.on.accept(thisArg),
);

nbHandlerRegistries.onDataEvent(NBEventKeys.RELEASE, (_, thisArg) =>
  thisArg.lock.on.release(thisArg),
);
