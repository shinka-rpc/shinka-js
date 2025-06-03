import type { Serializer, Message } from "@shinka-rpc/core";
import { encode, decode } from "@msgpack/msgpack";

export default {
  serialize: encode,
  deserialize: decode as (value: unknown) => Message<unknown>,
} as Serializer;
