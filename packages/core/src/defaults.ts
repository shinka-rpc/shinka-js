import type { SerializerFactory, SerializerRoot } from "./types";

const dummy = <I, O>(v: I) => v as any as O;

export const defaultSerializer: SerializerFactory<any, any, any> = () => ({
  serialize: dummy,
  deserialize: dummy,
  transportInitOpts: { mode: "not-serialized" },
  typeHints: { serialize: "Function", deserialize: "Function" },
});

export const defaultSerializerRoot: SerializerRoot<any, any, any> = () =>
  defaultSerializer;

export const defaultRequestTimeout = 45_000;
