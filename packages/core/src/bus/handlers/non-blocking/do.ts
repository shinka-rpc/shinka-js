import {
  NBRequestKeys,
  NBEventKeys,
  NBAcquire,
  NBConsensus,
} from "./constants";
import type { ShinkaDataEvent, ShinkaRequest } from "../../../types";

export const nbEvents = {
  release: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(NBEventKeys.RELEASE, 0),
};

export const nbRequests = {
  acquire: (
    request: ShinkaRequest<any, any>,
    target: NBAcquire,
    timeout: number,
    nonce: number,
  ) => request<NBConsensus>(NBRequestKeys.ACQUIRE, [target, timeout, nonce]),
};
