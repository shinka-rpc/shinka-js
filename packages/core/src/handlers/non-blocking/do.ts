import { NBRequestKeys, NBEventKeys, NBAcquire } from "./constants";
import type { ShinkaDataEvent, ShinkaRequest } from "../../types";

export const nbEvents = {
  release: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(NBEventKeys.RELEASE, 0),
};

export const nbRequests = {
  acquire: (
    request: ShinkaRequest<any, any>,
    target: NBAcquire,
    timeout: number,
  ) => request<void>(NBRequestKeys.ACQUIRE, [target, timeout]),
};
