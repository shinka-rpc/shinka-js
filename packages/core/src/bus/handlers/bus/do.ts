import { BusRequestKeys, BusEventKeys, type AbortTarget } from "./const-enums";
import type {
  REQID,
  ShinkaDoDataEvent,
  ShinkaDoRequest,
} from "../../../shinka";

const abortFn = (
  abortTarget: AbortTarget,
  dataEvent: ShinkaDoDataEvent<any, any>,
  id: REQID,
  reason: any,
) => dataEvent(abortTarget, [id, reason]);

export const busEvents = {
  heartbeat: (dataEvent: ShinkaDoDataEvent<any, any>) =>
    dataEvent(BusEventKeys.HEARTBEAT, 0),
  terminate: (dataEvent: ShinkaDoDataEvent<any, any>) =>
    dataEvent(BusEventKeys.TERMINATE, 0),
  abortUser: abortFn.bind(0, BusEventKeys.ABORT_USER),
  abortSerializer: abortFn.bind(0, BusEventKeys.ABORT_SERIALIZER),
  abortTransport: abortFn.bind(0, BusEventKeys.ABORT_TRANSPORT),
  abortLimon: abortFn.bind(0, BusEventKeys.ABORT_LIMON),
};

export const busRequests = {
  ping: (request: ShinkaDoRequest<any, any>) =>
    request<void>(BusRequestKeys.PING, 0),
};
