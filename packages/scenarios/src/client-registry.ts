import type { IBus, IBusAgg } from "@shinka-rpc/core";

export const clientRegistry = <SO, TO>(aggregator: IBusAgg<SO, TO>) => {
  const registry = new Set<IBus<any, any>>();
  aggregator.addEventListener("connect", registry.add.bind(registry));
  aggregator.addEventListener("disconnect", registry.delete.bind(registry));
  return registry;
};
