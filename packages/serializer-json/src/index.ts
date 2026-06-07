import type { SerializerFactory, SerializerRoot } from "@shinka-rpc/core";

export default (() =>
  (() => ({
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    transportInitOpts: { mode: "text" },
    typeHints: { serialize: "Function", deserialize: "Function" },
  })) as SerializerFactory<any>) as SerializerRoot<any, any, any>;
