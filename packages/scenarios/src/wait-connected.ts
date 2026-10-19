import { ReusablePromise } from "@shinka-rpc/concurrency";
import type { IBus } from "@shinka-rpc/core";

export const waitConnected = (bus: IBus<any, any>) => {
  const rPromise = new ReusablePromise<void>();
  const reset = rPromise.reset;

  bus.addEventListener("connected", () => rPromise.resolve());
  bus.addEventListener("connecting", reset);
  bus.addEventListener("disconnecting", reset);
  bus.addEventListener("disconnected", reset);

  return rPromise;
};
