import type { SerializerFactory, SerializerRoot } from "@shinka-rpc/core";

export default (() =>
  (() => ({
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    transportInitOpts: { mode: "text", contentType: "application/json" },
    typeHints: { serialize: "Function", deserialize: "Function" },
  })) as SerializerFactory<any, any>) as SerializerRoot<any, any, any>;
