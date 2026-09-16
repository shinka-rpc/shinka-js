import type {
  DeserializerFnSync,
  DeserializerFnAsync,
  InternalHandlerThisArg,
} from "@shinka-rpc/core";

import type {
  HighOrderDeserializerFnAsync,
  HighOrderDeserializerFnSync,
  HighOrderSerialize,
  NestedSerializerOpts,
  SerializationPair,
  SerializationRecords,
} from "./types";

const deserializerSyncSync =
  <T extends string | Uint8Array, SO, SS>(
    highOrderDeserialize: HighOrderDeserializerFnSync<any, T, SO, SS>,
  ) =>
  (
    deserialize: DeserializerFnSync<any, T>,
    thisArg: InternalHandlerThisArg<SO, any, SS>,
  ) =>
  (data: T) =>
    deserialize(highOrderDeserialize(data, thisArg));

const deserializerSyncAsync =
  <T extends string | Uint8Array, SO, SS>(
    highOrderDeserialize: HighOrderDeserializerFnSync<any, T, SO, SS>,
  ) =>
  (
    deserialize: DeserializerFnAsync<any, T>,
    thisArg: InternalHandlerThisArg<SO, any, SS>,
  ) =>
  (data: T) =>
    deserialize(highOrderDeserialize(data, thisArg));

const deserializerAsyncSync =
  <T extends string | Uint8Array, SO, SS>(
    highOrderDeserialize: HighOrderDeserializerFnAsync<any, T, SO, SS>,
  ) =>
  (
    deserialize: DeserializerFnSync<any, T>,
    thisArg: InternalHandlerThisArg<SO, any, SS>,
  ) =>
  async (data: T) =>
    deserialize(await highOrderDeserialize(data, thisArg));

const deserializerAsyncAsync =
  <T extends string | Uint8Array, SO, SS>(
    highOrderDeserialize: HighOrderDeserializerFnAsync<any, T, SO, SS>,
  ) =>
  (
    deserialize: DeserializerFnAsync<any, T>,
    thisArg: InternalHandlerThisArg<SO, any, SS>,
  ) =>
  async (data: T) =>
    await deserialize(await highOrderDeserialize(data, thisArg));

const deserializers = {
  txt: {
    Function: <SO, SS>(
      text: HighOrderDeserializerFnSync<any, string, SO, SS>,
    ) => ({
      Function: deserializerSyncSync(text),
      AsyncFunction: deserializerSyncAsync(text),
    }),
    AsyncFunction: <SO, SS>(
      text: HighOrderDeserializerFnSync<any, string, SO, SS>,
    ) => ({
      Function: deserializerAsyncSync(text),
      AsyncFunction: deserializerAsyncAsync(text),
    }),
  },
  bin: {
    Function: <SO, SS>(
      bin: HighOrderDeserializerFnSync<any, Uint8Array, SO, SS>,
    ) => ({
      Function: deserializerSyncSync(bin),
      AsyncFunction: deserializerSyncAsync(bin),
    }),
    AsyncFunction: <SO, SS>(
      bin: HighOrderDeserializerFnSync<any, Uint8Array, SO, SS>,
    ) => ({
      Function: deserializerAsyncSync(bin),
      AsyncFunction: deserializerAsyncAsync(bin),
    }),
  },
};

export default <HOSO, NEXT, SS>(
  {
    0: textFn,
    1: textType,
  }: SerializationPair<HOSO, string, SS>["deserialize"],
  {
    0: binFn,
    1: binType,
  }: SerializationPair<HOSO, Uint8Array, SS>["deserialize"],
) =>
  ({
    text: deserializers.txt[textType](textFn),
    binary: deserializers.bin[binType](binFn),
  }) as SerializationRecords<
    HighOrderSerialize<NestedSerializerOpts<HOSO, NEXT>>
  >;
