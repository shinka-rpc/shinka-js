import type { SerializerRoot, DeserializerFn } from "@shinka-rpc/core";
import { load, dump, type DumpOptions } from "js-yaml";

export type YamlSerializerOptions = DumpOptions;

export default ((shinkaOn) => (thisArg, opts) => ({
  serialize: dump,
  deserialize: load as DeserializerFn<any, any>,
  transportInitOpts: {
    mode: "text",
    mime: { type: "application", subtype: "yaml" },
  },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) satisfies SerializerRoot<YamlSerializerOptions, any, any>;
