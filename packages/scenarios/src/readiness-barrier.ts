import { ReusablePromise } from "@shinka-rpc/concurrency";
import type { IBus } from "@shinka-rpc/core";

const dummy = () => {};

export const readinessBarrier = <SO, TO>(
  bus: IBus<SO, TO>,
  complete: (bus: IBus<SO, TO>) => void | Promise<void> = dummy,
  onFailure: (e: any, bus: IBus<SO, TO>) => void = dummy,
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
      await complete(bus);
      if (current === generation) rPromise.resolve();
    } catch (e) {
      if (current !== generation) return;
      bus.stop();
      onFailure(e, bus);
    }
  });

  bus.addEventListener("connecting", reset);
  bus.addEventListener("disconnecting", reset);
  bus.addEventListener("disconnected", reset);

  return rPromise;
};
