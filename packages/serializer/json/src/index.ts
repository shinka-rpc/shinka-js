import type { SerializerFactory, CommonBus } from "@shinka-rpc/core";

export default ((_: CommonBus) => ({
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  transportInitOpts: { mode: "text" },
})) as SerializerFactory;
