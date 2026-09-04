import type {
  SerializerRoot,
  SerializerFnSync,
  SerializerFnAsync,
  SerializationMode,
  FnConstructorName,
  SerializerFn,
  DeserializerFnSync,
  DeserializerFnAsync,
  DeserializerFn,
  SerializerInstance,
  StructuredMimeType,
} from "@shinka-rpc/core";

import { joinMimeSubtype } from "@shinka-rpc/util";

type SerializationPair<SO, T extends string | Uint8Array> = {
  serialize: [SerializerFn<T, any, SO>, FnConstructorName];
  deserialize: [DeserializerFn<any, any>, FnConstructorName];
};

export type HighOrderSerializerProps<SO> = {
  mode: SerializationMode;
  mimeSubType: string;
  text: SerializationPair<SO, string>;
  bin: SerializationPair<SO, Uint8Array>;
};

export type NestedSerializerOpts<CURR, NEXT> = {
  curr: CURR;
  next: NEXT;
};

const deserializerSyncSync =
  <T extends string | Uint8Array>(
    nextDeserialize: DeserializerFnSync<any, T>,
  ) =>
  (deserialize: DeserializerFnSync<any, T>) =>
  (data: T) =>
    deserialize(nextDeserialize(data));

const deserializerSyncAsync =
  <T extends string | Uint8Array>(
    nextDeserialize: DeserializerFnSync<any, T>,
  ) =>
  (deserialize: DeserializerFnAsync<any, T>) =>
  (data: T) =>
    deserialize(nextDeserialize(data));

const deserializerAsyncSync =
  <T extends string | Uint8Array>(
    nextDeserialize: DeserializerFnAsync<any, T>,
  ) =>
  (deserialize: DeserializerFnSync<any, T>) =>
  async (data: T) => {
    console.log(data);
    return deserialize(await nextDeserialize(data));
  };

const deserializerAsyncAsync =
  <T extends string | Uint8Array>(
    nextDeserialize: DeserializerFnAsync<any, T>,
  ) =>
  (deserialize: DeserializerFnSync<any, T>) =>
  async (data: T) =>
    await deserialize(await nextDeserialize(data));

const serializerSyncSync =
  <T extends string | Uint8Array, CURR, NEXT>(
    nextSerialize: SerializerFnSync<any, T, NEXT>,
  ) =>
  (serialize: SerializerFnSync<any, T, CURR>) =>
  (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    nextSerialize(serialize(data, opts?.curr), opts?.next);

const serializerSyncAsync =
  <T extends string | Uint8Array, CURR, NEXT>(
    nextSerialize: SerializerFnAsync<any, T, NEXT>,
  ) =>
  (serialize: SerializerFnAsync<any, T, CURR>) =>
  async (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    nextSerialize(await serialize(data, opts?.curr), opts?.next);

const serializerAsyncSync =
  <T extends string | Uint8Array, CURR, NEXT>(
    nextSerialize: SerializerFnAsync<any, T, NEXT>,
  ) =>
  (serialize: SerializerFnSync<any, T, CURR>) =>
  (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    nextSerialize(serialize(data, opts?.curr), opts?.next);

const serializerAsyncAsync =
  <T extends string | Uint8Array, CURR, NEXT>(
    nextSerialize: SerializerFnAsync<any, T, NEXT>,
  ) =>
  (serialize: SerializerFnAsync<any, T, CURR>) =>
  async (data: any, opts?: NestedSerializerOpts<CURR, NEXT>) =>
    await nextSerialize(await serialize(data, opts?.curr), opts?.next);

type SerializationRecords<T> = Record<
  SerializationMode,
  Record<FnConstructorName, T>
>;

type HighOrderSerialize = <SO>(
  serialize: SerializerFn<any, any, SO>,
) => SerializerFn<any, any, SO>;

type HighOrderDeserialize = (
  deserialize: DeserializerFn<any, any>,
) => DeserializerFn<any, any>;

const construct = <T extends HighOrderSerialize | HighOrderDeserialize>(
  records: SerializationRecords<T>,
  mode: SerializationMode,
  instance: SerializerInstance<any>,
  key: "serialize" | "deserialize",
) => {
  const {
    [key]: prevFn,
    typeHints: { [key]: hint },
  } = instance;
  return records[mode][hint || prevFn.constructor.name](prevFn);
};

const nextMime = (mime: StructuredMimeType, mimeSubType: string) =>
  ({
    type: mime.type,
    subtype: joinMimeSubtype(mime.subtype, mimeSubType),
  }) satisfies StructuredMimeType;

const __serializers = {
  txt: {
    Function: <SO>(text: SerializerFnSync<string, any, SO>) => ({
      Function: serializerSyncSync(text),
      AsyncFunction: serializerSyncAsync(text),
    }),
    AsyncFunction: <SO>(text: SerializerFnSync<string, any, SO>) => ({
      Function: serializerAsyncSync(text),
      AsyncFunction: serializerAsyncAsync(text),
    }),
  },
  bin: {
    Function: <SO>(bin: SerializerFnSync<Uint8Array, any, SO>) => ({
      Function: serializerSyncSync(bin),
      AsyncFunction: serializerSyncAsync(bin),
    }),
    AsyncFunction: <SO>(bin: SerializerFnSync<Uint8Array, any, SO>) => ({
      Function: serializerAsyncSync(bin),
      AsyncFunction: serializerAsyncAsync(bin),
    }),
  },
};

const __deserializers = {
  txt: {
    Function: (text: DeserializerFnSync<any, string>) => ({
      Function: deserializerSyncSync(text),
      AsyncFunction: deserializerSyncAsync(text),
    }),
    AsyncFunction: (text: DeserializerFnSync<any, string>) => ({
      Function: deserializerAsyncSync(text),
      AsyncFunction: deserializerAsyncAsync(text),
    }),
  },
  bin: {
    Function: (bin: DeserializerFnSync<any, Uint8Array>) => ({
      Function: deserializerSyncSync(bin),
      AsyncFunction: deserializerSyncAsync(bin),
    }),
    AsyncFunction: (bin: DeserializerFnSync<any, Uint8Array>) => ({
      Function: deserializerAsyncSync(bin),
      AsyncFunction: deserializerAsyncAsync(bin),
    }),
  },
};

const makeSerializers = <SO>(
  { 0: textFn, 1: textType }: SerializationPair<SO, string>["serialize"],
  { 0: binFn, 1: binType }: SerializationPair<SO, Uint8Array>["serialize"],
) =>
  ({
    text: __serializers.txt[textType](textFn),
    binary: __serializers.bin[binType](binFn),
  }) as SerializationRecords<HighOrderSerialize>;

const makeDeserializers = <SO>(
  { 0: textFn, 1: textType }: SerializationPair<SO, string>["deserialize"],
  { 0: binFn, 1: binType }: SerializationPair<SO, Uint8Array>["deserialize"],
) =>
  ({
    text: __deserializers.txt[textType](textFn),
    binary: __deserializers.bin[binType](binFn),
  }) as SerializationRecords<HighOrderSerialize>;

export default <CURR>({
  mode: nextMode,
  text,
  mimeSubType,
  bin,
}: HighOrderSerializerProps<CURR>) => {
  const serializers = makeSerializers(text.serialize, bin.serialize);
  const deserializers = makeDeserializers(text.deserialize, bin.deserialize);

  return <NEXT>(
    parent: SerializerRoot<NestedSerializerOpts<CURR, NEXT>, any, any>,
  ) =>
    ((shinkaOn) => {
      const parentSerializerFactory = parent(shinkaOn);

      return async (thisArg, opts) => {
        const maybeSerializerInstance = parentSerializerFactory(thisArg, opts);

        const parentInstance =
          maybeSerializerInstance instanceof Promise
            ? await maybeSerializerInstance
            : maybeSerializerInstance;

        const { transportInitOpts: prevTransportInitOpts, typeHints } =
          parentInstance;

        const { mode } = prevTransportInitOpts;

        if (mode === "not-serialized") throw new Error("invalid mode");

        const serialize = construct(
          serializers,
          mode,
          parentInstance,
          "serialize",
        );

        const deserialize = construct(
          deserializers,
          mode,
          parentInstance,
          "deserialize",
        );

        const mime = nextMime(prevTransportInitOpts.mime, mimeSubType);
        const transportInitOpts = { mode: nextMode, mime };
        return { serialize, deserialize, transportInitOpts, typeHints };
      };
    }) satisfies SerializerRoot<NestedSerializerOpts<CURR, NEXT>, any, any>;
};
