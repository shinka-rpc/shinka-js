import type { SerializerRoot, Message } from "@shinka-rpc/core";
import { BSON } from "@kai3341/bsonfy";

const { serialize, deserialize: bsonDeserialize } = BSON;

const deserializers = {
  array: (data: any) =>
    bsonDeserialize(data, true, undefined, true) as Message<any>,
  object: (data: any) =>
    bsonDeserialize(data, true, undefined, false) as Message<any>,
};

export default ((shinkaOn) => (thisArg, opts) => ({
  serialize,
  deserialize: deserializers[opts.root],
  transportInitOpts: { mode: "binary", contentType: "application/bson" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) satisfies SerializerRoot<void, any, any>;
