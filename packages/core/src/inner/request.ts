import { RequestKeys } from "../constants";
import type { RequestHandler } from "../types";
import type { ClientBus } from "../client";
import type { CommonBus } from "../common";
import type { ReqRegistryType } from "../factory/registry";

interface Requests {
  [key: number]: RequestHandler<ClientBus & CommonBus, any>;
}

const requests: Requests = {
  [RequestKeys.PING]: () => {},
};

export const registerRequestsInner = (register: ReqRegistryType[1]) =>
  Object.entries(requests).forEach(([k, v]) => register(k, v));
