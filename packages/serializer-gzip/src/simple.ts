import type {
  SerializerRoot,
  SerializerFactory,
  TransportInitOptsMode,
  FnConstructorName,
  SerializerFnSync,
  SerializerFnAsync,
  SerializerFn,
  DeserializerFnSync,
  DeserializerFnAsync,
  DeserializerFn,
} from "@shinka-rpc/core";

import { inflate, deflate } from "pako";

const invalidMode = () => {
  throw new Error("invalid mode");
};

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const makeSerializer = {
  "not-serialized": { Function: invalidMode, AsyncFunction: invalidMode },
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
  TransportInitOptsMode,
  Record<
    FnConstructorName,
    <SO>(serialize: SerializerFn<any, any, SO>) => SerializerFn<any, any, SO>
  >
>;

const makeDeserializer = {
  "not-serialized": { Function: invalidMode, AsyncFunction: invalidMode },
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
  TransportInitOptsMode,
  Record<
    FnConstructorName,
    (deserialize: DeserializerFn<any, any>) => DeserializerFn<any, any>
  >
>;

const defaultContentType: Record<
  Exclude<TransportInitOptsMode, "not-serialized">,
  string
> = {
  text: "text/plain",
  binary: "application/octet-stream",
};

export const simpleGzip = <SO, TO, TA>(parent: SerializerRoot<SO, TO, TA>) =>
  ((shinkaOn) => {
    const parentSerializerFactory = parent(shinkaOn);

    return (async () => {
      const maybeSerializerInstance = parentSerializerFactory();

      const parentInstance =
        maybeSerializerInstance instanceof Promise
          ? await maybeSerializerInstance
          : maybeSerializerInstance;

      const { mode } = parentInstance.transportInitOpts;

      const serialize = makeSerializer[mode][
        parentInstance.typeHints.serialize
      ](parentInstance.serialize);

      const deserialize = makeDeserializer[mode][
        parentInstance.typeHints.deserialize
      ](parentInstance.deserialize);

      const contentType =
        "gzip+" +
        (parentInstance.transportInitOpts.contentType ||
          defaultContentType[
            mode as Exclude<TransportInitOptsMode, "not-serialized">
          ]);

      return {
        serialize,
        deserialize,
        transportInitOpts: {
          mode,
          contentType,
        },
        typeHints: parentInstance.typeHints,
      };
    }) as SerializerFactory<any, any>;
  }) as SerializerRoot<any, any, any>;
