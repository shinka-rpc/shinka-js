import { RequestKeys } from "../constants";
import type { CommonBus } from "../common";
import type { ReqRegistryType } from "../factory/registry";
import type { ShinkaMeta } from "../types";

const requests = new Map<
  RequestKeys,
  { cb: (data: any, thisArg: CommonBus) => any; metadata?: ShinkaMeta }
>([
  [RequestKeys.PING, { cb: () => {} }],
  //
]);

export const registerRequestsInner = (register: ReqRegistryType[1]) => {
  for (const [k, v] of requests.entries()) register(k, v);
};
