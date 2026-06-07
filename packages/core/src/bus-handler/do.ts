import { BusRequestKeys, BusEventKeys } from "../constants";
import type { ShinkaDataEvent, ShinkaRequest } from "../types";

export const busEvents = {
  iAmAlive: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(BusEventKeys.I_AM_ALIVE, 0),
  terminate: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(BusEventKeys.TERMINATE, 0),
  exchange: (dataEvent: ShinkaDataEvent<any, any>, value: number) =>
    dataEvent(BusEventKeys.EXCHANGE, value),
};

export const busRequests = {
  ping: (request: ShinkaRequest<any, any>) =>
    request<void>(BusRequestKeys.PING, 0),
};
