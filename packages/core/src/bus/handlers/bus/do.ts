import { BusRequestKeys, BusEventKeys } from "./const-enums";
import type { ShinkaDataEvent, ShinkaRequest } from "../../../types";

export const busEvents = {
  heartbeat: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(BusEventKeys.HEARTBEAT, 0),
  terminate: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(BusEventKeys.TERMINATE, 0),
};

export const busRequests = {
  ping: (request: ShinkaRequest<any, any>) =>
    request<void>(BusRequestKeys.PING, 0),
};
