import type { SerializerRoot } from "@shinka-rpc/core";

export default ((shinkaOn) => () => ({
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  transportInitOpts: { mode: "text", contentType: "application/json" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) as SerializerRoot<any, any, any>;
