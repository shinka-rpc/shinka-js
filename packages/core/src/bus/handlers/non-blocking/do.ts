import { NBEventKeys } from "./const-enums";
import { NBAcquire } from "../../const-enums";
import type { NBShinka } from "../../../types";

export const nbEvent = {
  acquire: (
    dataEvent: NBShinka<any, any, any>["dataEvent"],
    target: NBAcquire,
    timeout: number,
    nonces: number[],
  ) => dataEvent(NBEventKeys.ACQUIRE, [target, timeout, ...nonces]),
  accept: (dataEvent: NBShinka<any, any, any>["dataEvent"]) =>
    dataEvent(NBEventKeys.ACCEPT, 0),
  release: (dataEvent: NBShinka<any, any, any>["dataEvent"]) =>
    dataEvent(NBEventKeys.RELEASE, 0),
};

export const nbRequest = {};
