import type { SerializerFactory } from "@shinka-rpc/core";
import { BSON } from "@kai3341/bsonfy";

const { deserialize: bson_deserialize } = BSON;

export default ((_) => ({
  serialize: BSON.serialize,
  deserialize: (data: any) => bson_deserialize(data, true, undefined, true),
  transportInitOpts: { mode: "binary" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) as SerializerFactory;
