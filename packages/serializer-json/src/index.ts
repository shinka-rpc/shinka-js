import type { Serializer } from "@shinka-rpc/core";

export default {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
} as Serializer;
