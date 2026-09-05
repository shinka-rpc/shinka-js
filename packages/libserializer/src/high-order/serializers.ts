import type {
  SerializerFnSync,
  SerializerFnAsync,
  InternalHandlerThisArg,
} from "@shinka-rpc/core";

import type {
  HighOrderSerialize,
  HighOrderSerializerFnAsync,
  HighOrderSerializerFnSync,
  NestedSerializerOpts,
  SerializationPair,
  SerializationRecords,
} from "./types";

const serializerSyncSync =
  <T extends string | Uint8Array, CURR, NEXT, SS>(
    highOrderSerialize: HighOrderSerializerFnSync<any, T, NEXT, SS>,
  ) =>
  (
    serialize: SerializerFnSync<any, T, CURR>,
    thisArg: InternalHandlerThisArg<NEXT, any, SS>,
  ) =>
  (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    highOrderSerialize(serialize(data, opts?.curr), thisArg, opts?.next);

const serializerSyncAsync =
  <T extends string | Uint8Array, CURR, NEXT, SS>(
    highOrderSerialize: HighOrderSerializerFnSync<any, T, NEXT, SS>,
  ) =>
  (
    serialize: SerializerFnAsync<any, T, CURR>,
    thisArg: InternalHandlerThisArg<NEXT, any, SS>,
  ) =>
  async (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    highOrderSerialize(await serialize(data, opts?.curr), thisArg, opts?.next);

const serializerAsyncSync =
  <T extends string | Uint8Array, CURR, NEXT, SS>(
    highOrderSerialize: HighOrderSerializerFnAsync<any, T, NEXT, SS>,
  ) =>
  (
    serialize: SerializerFnSync<any, T, CURR>,
    thisArg: InternalHandlerThisArg<NEXT, any, SS>,
  ) =>
  (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    highOrderSerialize(serialize(data, opts?.curr), thisArg, opts?.next);

const serializerAsyncAsync =
  <T extends string | Uint8Array, CURR, NEXT, SS>(
    highOrderSerialize: HighOrderSerializerFnAsync<any, T, NEXT, SS>,
  ) =>
  (
    serialize: SerializerFnAsync<any, T, CURR>,
    thisArg: InternalHandlerThisArg<NEXT, any, SS>,
  ) =>
  async (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    await highOrderSerialize(
      await serialize(data, opts?.curr),
      thisArg,
      opts?.next,
    );

const serializers = {
  txt: {
    Function: <SO, SS>(
      text: HighOrderSerializerFnSync<string, any, SO, SS>,
    ) => ({
      Function: serializerSyncSync(text),
      AsyncFunction: serializerSyncAsync(text),
    }),
    AsyncFunction: <SO, SS>(
      text: HighOrderSerializerFnSync<string, any, SO, SS>,
    ) => ({
      Function: serializerAsyncSync(text),
      AsyncFunction: serializerAsyncAsync(text),
    }),
  },
  bin: {
    Function: <SO, SS>(
      bin: HighOrderSerializerFnSync<Uint8Array, any, SO, SS>,
    ) => ({
      Function: serializerSyncSync(bin),
      AsyncFunction: serializerSyncAsync(bin),
    }),
    AsyncFunction: <SO, SS>(
      bin: HighOrderSerializerFnSync<Uint8Array, any, SO, SS>,
    ) => ({
      Function: serializerAsyncSync(bin),
      AsyncFunction: serializerAsyncAsync(bin),
    }),
  },
};

export default <SO, SS>(
  { 0: textFn, 1: textType }: SerializationPair<SO, string, SS>["serialize"],
  { 0: binFn, 1: binType }: SerializationPair<SO, Uint8Array, SS>["serialize"],
) =>
  ({
    text: serializers.txt[textType](textFn),
    binary: serializers.bin[binType](binFn),
  }) as SerializationRecords<HighOrderSerialize>;
