import type { SerializerRoot, DeserializerFn } from "@shinka-rpc/core";
import { encode, decode } from "@msgpack/msgpack";

export type SerializerMSGPackOpts = NonNullable<Parameters<typeof encode>[1]>;

export default ((shinkaOn) => (thisArg, opts) => ({
  serialize: encode,
  deserialize: decode as DeserializerFn<any, Uint8Array>,
  transportInitOpts: {
    mode: "binary",
    mime: { type: "application", subtype: "vnd.msgpack" },
  },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) satisfies SerializerRoot<SerializerMSGPackOpts, any, any>;
