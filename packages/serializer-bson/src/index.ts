import type { SerializerRoot } from "@shinka-rpc/core";
import { BSON } from "@kai3341/bsonfy";

const { serialize, deserialize: bsonDeserialize } = BSON;
const deserializers = {
  array: (data: any) => bsonDeserialize(data, true, undefined, true),
  object: (data: any) => bsonDeserialize(data, true, undefined, false),
};

export default ((shinkaOn) => (thisArg, opts) => ({
  serialize,
  deserialize: deserializers[opts.root],
  transportInitOpts: { mode: "binary", contentType: "application/bson" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) as SerializerRoot<void, any, any>;
