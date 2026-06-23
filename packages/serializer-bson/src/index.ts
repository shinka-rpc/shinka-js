import type { SerializerRoot } from "@shinka-rpc/core";
import { BSON } from "@kai3341/bsonfy";

const { serialize, deserialize: bsonDeserialize } = BSON;
const deserializeArray = (data: any) =>
  bsonDeserialize(data, true, undefined, true);
const deserializeObject = (data: any) =>
  bsonDeserialize(data, true, undefined, false);

export default ((shinkaOn) => (thisArg, opts) => ({
  serialize,
  deserialize: opts.root === "array" ? deserializeArray : deserializeObject,
  transportInitOpts: { mode: "binary", contentType: "application/bson" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) as SerializerRoot<any, any, any>;
