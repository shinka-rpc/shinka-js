import type { IBus, IBusAgg } from "@shinka-rpc/core";

export const clientRegistry = <SO, TO>(aggregator: IBusAgg<SO, TO>) => {
  const registry = new Set<IBus<any, any>>();
  const removeFn = registry.delete.bind(registry);

  aggregator.addEventListener("connected", registry.add.bind(registry));
  aggregator.addEventListener("connecting", removeFn);
  aggregator.addEventListener("disconnecting", removeFn);
  aggregator.addEventListener("disconnected", removeFn);

  return registry;
};
