import type { SerializerFactory, SerializerRoot } from "@shinka-rpc/core";
import { encode, decode } from "@msgpack/msgpack";

export default (() =>
  (() => ({
    serialize: encode,
    deserialize: decode,
    transportInitOpts: { mode: "binary" },
    typeHints: { serialize: "Function", deserialize: "Function" },
  })) as SerializerFactory<any, any>) as SerializerRoot<any, any, any>;
