import { ReusablePromise } from "@shinka-rpc/concurrency";
import type { IBus } from "@shinka-rpc/core";

const dummy = () => {};

export const readinessBarrier = (
  bus: IBus<any, any>,
  complete: () => void | Promise<void> = dummy,
  onFailure: (e: any) => void = dummy,
) => {
  let generation = 0;
  const rPromise = new ReusablePromise<void>();
  const reset = () => {
    generation++;
    rPromise.reset();
  };

  bus.addEventListener("connected", async () => {
    const current = generation;
    try {
      await complete();
      if (current === generation) rPromise.resolve();
    } catch (e) {
      if (current !== generation) return;
      bus.stop();
      onFailure(e);
    }
  });

  bus.addEventListener("connecting", reset);
  bus.addEventListener("disconnecting", reset);
  bus.addEventListener("disconnected", reset);

  return rPromise;
};
