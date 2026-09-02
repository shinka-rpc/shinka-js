import type { SerializerRoot } from "@shinka-rpc/core";

export type JSONSerializerOptions = {
  replacer?: (this: any, key: string, value: any) => any;
  space?: string | number;
};

export default ((shinkaOn) => (thisArg, opts) => ({
  serialize: (data: any, { replacer, space }: JSONSerializerOptions = {}) =>
    JSON.stringify(data, replacer, space),
  deserialize: JSON.parse,
  transportInitOpts: { mode: "text", contentType: "application/json" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) satisfies SerializerRoot<JSONSerializerOptions, any, any>;
