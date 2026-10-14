import { ReusablePromise } from "@shinka-rpc/concurrency";
import type { IBus } from "@shinka-rpc/core";

export const waitConnected = (bus: IBus<any, any>) => {
  const rPromise = new ReusablePromise<void>();

  bus.addEventListener("connect", () => rPromise.resolve());
  bus.addEventListener("disconnect", rPromise.reset);

  return rPromise;
};
