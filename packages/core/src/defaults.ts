import type {
  SerializerFactory,
  SerializerRoot,
  ExclusiveLock,
  ExclusiveLockOn,
} from "./types";

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

// ELNA = Exclusive Lock Not Available
const ELNA = (...args: any) => {
  throw "ExclusiveLock is not available";
};

const ELOn: ExclusiveLockOn<any, any, any> & ExclusiveLockOn<any, any, any> =
  Object.freeze({ acquire: ELNA, accept: ELNA, release: ELNA });

export const defaultExclusiveLock: ExclusiveLock<any, any, any> = Object.freeze(
  { on: ELOn, acquire: ELNA, start: dummy, stop: dummy },
);
