import type { Serializer } from "@shinka-rpc/core";
import { BSON } from "@kai3341/bsonfy";

const { deserialize: bson_deserialize } = BSON;

export default {
  serialize: BSON.serialize,
  deserialize: (data: any) => bson_deserialize(data, true, undefined, true),
} as Serializer;
