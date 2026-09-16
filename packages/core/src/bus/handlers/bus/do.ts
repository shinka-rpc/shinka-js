import { BusRequestKeys, BusEventKeys } from "./const-enums";
import type { ShinkaDoDataEvent, ShinkaDoRequest } from "../../../shinka";

export const busEvents = {
  heartbeat: (dataEvent: ShinkaDoDataEvent<any, any>) =>
    dataEvent(BusEventKeys.HEARTBEAT, 0),
  terminate: (dataEvent: ShinkaDoDataEvent<any, any>) =>
    dataEvent(BusEventKeys.TERMINATE, 0),
};

export const busRequests = {
  ping: (request: ShinkaDoRequest<any, any>) =>
    request<void>(BusRequestKeys.PING, 0),
};
