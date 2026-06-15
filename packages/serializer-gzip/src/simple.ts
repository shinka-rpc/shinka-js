import type {
  SerializerRoot,
  FnConstructorName,
  SerializerFnSync,
  SerializerFnAsync,
  SerializerFn,
  DeserializerFnSync,
  DeserializerFnAsync,
  DeserializerFn,
  SerializationMode,
} from "@shinka-rpc/core";

import { inflate, deflate } from "pako";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const makeSerializer = {
  text: {
    Function:
      <SO>(serialize: SerializerFnSync<any, string, SO>) =>
      (data: any) =>
        deflate(textEncoder.encode(serialize(data))),
    AsyncFunction:
      <SO>(serialize: SerializerFnAsync<any, string, SO>) =>
      async (data: any) =>
        deflate(textEncoder.encode(await serialize(data))),
  },
  binary: {
    Function:
      <SO>(serialize: SerializerFnSync<any, Uint8Array, SO>) =>
      (data: any) =>
        deflate(serialize(data)),
    AsyncFunction:
      <SO>(serialize: SerializerFnAsync<any, Uint8Array, SO>) =>
      async (data: any) =>
        deflate(await serialize(data)),
  },
} as Record<
  SerializationMode,
  Record<
    FnConstructorName,
    <SO>(serialize: SerializerFn<any, any, SO>) => SerializerFn<any, any, SO>
  >
>;

const makeDeserializer = {
  text: {
    Function: (deserialize: DeserializerFnSync<any, string>) => (data: any) =>
      deserialize(textDecoder.decode(inflate(data))),
    AsyncFunction:
      (deserialize: DeserializerFnAsync<any, string>) => async (data: any) =>
        await deserialize(textDecoder.decode(deflate(data))),
  },
  binary: {
    Function:
      (deserialize: DeserializerFnSync<any, Uint8Array>) => (data: any) =>
        deserialize(inflate(data)),
    AsyncFunction:
      (deserialize: DeserializerFnAsync<any, Uint8Array>) =>
      async (data: any) =>
        await deserialize(inflate(data)),
  },
} as Record<
  SerializationMode,
  Record<
    FnConstructorName,
    (deserialize: DeserializerFn<any, any>) => DeserializerFn<any, any>
  >
>;

export const simpleGzip = <SO, TO, TA>(parent: SerializerRoot<SO, TO, TA>) =>
  ((shinkaOn) => {
    const parentSerializerFactory = parent(shinkaOn);

    return async () => {
      const maybeSerializerInstance = parentSerializerFactory();

      const parentInstance =
        maybeSerializerInstance instanceof Promise
          ? await maybeSerializerInstance
          : maybeSerializerInstance;

      const { mode } = parentInstance.transportInitOpts;

      if (mode === "not-serialized") throw new Error("invalid mode");

      const serialize = makeSerializer[mode][
        parentInstance.typeHints.serialize
      ](parentInstance.serialize);

      const deserialize = makeDeserializer[mode][
        parentInstance.typeHints.deserialize
      ](parentInstance.deserialize);

      const contentType =
        "gzip+" + parentInstance.transportInitOpts.contentType;

      return {
        serialize,
        deserialize,
        transportInitOpts: { mode: "binary", contentType },
        typeHints: parentInstance.typeHints,
      };
    };
  }) as SerializerRoot<any, any, any>;
