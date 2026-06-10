import type { SerializerFactory, SerializerRoot } from "@shinka-rpc/core";
import { encode, decode, type EncoderOptions } from "@msgpack/msgpack";

export default (() =>
  (() => ({
    serialize: encode,
    deserialize: decode,
    transportInitOpts: {
      mode: "binary",
      contentType: "application/vnd.msgpack",
    },
    typeHints: { serialize: "Function", deserialize: "Function" },
  })) as SerializerFactory<EncoderOptions, any>) as SerializerRoot<
  EncoderOptions,
  any,
  any
>;
