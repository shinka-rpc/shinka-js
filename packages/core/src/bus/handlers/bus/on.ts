import { BusRequestKeys, BusEventKeys } from "./const-enums";
import { createHandlerRegistries, type REQID } from "../../../shinka";

import type {
  AbortCtlKey,
  BusHandlerRegistries,
  BusHandlerThisArg,
} from "../../../types";

export const busHandlerRegistries: BusHandlerRegistries<any, any, any> =
  createHandlerRegistries();

const { onDataEvent, onRequest } = busHandlerRegistries;

// === onRequest

onRequest(BusRequestKeys.PING, () => 1);

// === onDataEvent

const abortHandler = (
  key: AbortCtlKey,
  { 0: id, 1: reason }: [REQID, any],
  thisArg: BusHandlerThisArg<any, any, any>,
) => thisArg.abort[key](id, reason);

onDataEvent(BusEventKeys.HEARTBEAT, () => {});
onDataEvent(BusEventKeys.TERMINATE, (_, thisArg) => {
  thisArg.byeReset();
  thisArg.bus.stop();
});

(
  [
    [BusEventKeys.ABORT_LIMON, "L"],
    [BusEventKeys.ABORT_TRANSPORT, "T"],
    [BusEventKeys.ABORT_SERIALIZER, "S"],
    [BusEventKeys.ABORT_USER, "U"],
  ] as const
).forEach(({ 0: target, 1: key }) =>
  busHandlerRegistries.onDataEvent(target, abortHandler.bind(0, key)),
);
