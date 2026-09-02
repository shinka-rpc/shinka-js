import type { SerializerRoot, DeserializerFn } from "@shinka-rpc/core";
import { encode, decode, type EncoderOptions } from "@msgpack/msgpack";

export default ((shinkaOn) => (thisArg, opts) => ({
  serialize: encode,
  deserialize: decode as DeserializerFn<any, Uint8Array>,
  transportInitOpts: { mode: "binary", contentType: "application/vnd.msgpack" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) satisfies SerializerRoot<EncoderOptions, unknown, unknown>;
