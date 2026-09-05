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
  InternalHandlerThisArg,
  SerializedData,
} from "@shinka-rpc/core";

import { joinMimeSubtype } from "@shinka-rpc/util";

const { assign: objectAssign } = Object;

export type ThisArgType = InternalHandlerThisArg<any, any, any>;

export type HighOrderSerializerFnSync<I, O extends SerializedData, SO, SS> = (
  data: I,
  thisArg: InternalHandlerThisArg<SO, any, SS>,
  opts?: SO,
) => O;

export type HighOrderSerializerFnAsync<I, O extends SerializedData, SO, SS> = (
  data: I,
  thisArg: InternalHandlerThisArg<SO, any, SS>,
  opts?: SO,
) => Promise<O>;

export type HighOrderSerializerFn<I, O extends SerializedData, SO, SS> =
  | HighOrderSerializerFnSync<I, O, SO, SS>
  | HighOrderSerializerFnAsync<I, O, SO, SS>;

export type HighOrderDeserializerFnSync<I, O extends SerializedData, SO, SS> = (
  data: O,
  thisArg: InternalHandlerThisArg<SO, any, SS>,
) => I;

export type HighOrderDeserializerFnAsync<
  I,
  O extends SerializedData,
  SO,
  SS,
> = (data: O, thisArg: InternalHandlerThisArg<SO, any, SS>) => Promise<I>;

export type HighOrderDeserializerFn<I, O extends SerializedData, SO, SS> =
  | HighOrderDeserializerFnSync<I, O, SO, SS>
  | HighOrderDeserializerFnAsync<I, O, SO, SS>;

type SerializationPair<SO, T extends string | Uint8Array, SS> = {
  serialize: [HighOrderSerializerFn<T, any, SO, SS>, FnConstructorName];
  deserialize: [HighOrderDeserializerFn<any, any, SO, SS>, FnConstructorName];
};

export type HighOrderSerializerProps<SO, SS, ISP> = {
  mode: SerializationMode;
  mimeSubType: string;
  text: SerializationPair<SO, string, SS>;
  bin: SerializationPair<SO, Uint8Array, SS>;
  stop?: (thisArg: InternalHandlerThisArg<any, any, SS>) => void;
  initState?: (
    props: ISP,
    thisArg: InternalHandlerThisArg<any, any, SS>,
  ) => SS | void;
};

export type NestedSerializerOpts<CURR, NEXT> = {
  curr: CURR;
  next: NEXT;
};

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

// ===

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

type SerializationRecords<T> = Record<
  SerializationMode,
  Record<FnConstructorName, T>
>;

type HighOrderSerialize = <SO>(
  serialize: SerializerFn<any, any, SO>,
  thisArg: InternalHandlerThisArg<SO, any, any>,
) => SerializerFn<any, any, SO>;

type HighOrderDeserialize = (
  deserialize: DeserializerFn<any, any>,
  thisArg: InternalHandlerThisArg<any, any, any>,
) => DeserializerFn<any, any>;

const construct = <T extends HighOrderSerialize | HighOrderDeserialize>(
  records: SerializationRecords<T>,
  mode: SerializationMode,
  instance: SerializerInstance<any>,
  key: "serialize" | "deserialize",
  thisArg: InternalHandlerThisArg<any, any, any>,
) => {
  const {
    [key]: prevFn,
    typeHints: { [key]: hint },
  } = instance;
  return records[mode][hint || prevFn.constructor.name](prevFn, thisArg);
};

const nextMime = (mime: StructuredMimeType, mimeSubType: string) =>
  ({
    type: mime.type,
    subtype: joinMimeSubtype(mime.subtype, mimeSubType),
  }) satisfies StructuredMimeType;

const __serializers = {
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

const __deserializers = {
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

const makeSerializers = <SO, SS>(
  { 0: textFn, 1: textType }: SerializationPair<SO, string, SS>["serialize"],
  { 0: binFn, 1: binType }: SerializationPair<SO, Uint8Array, SS>["serialize"],
) =>
  ({
    text: __serializers.txt[textType](textFn),
    binary: __serializers.bin[binType](binFn),
  }) as SerializationRecords<HighOrderSerialize>;

const makeDeserializers = <SO, SS>(
  { 0: textFn, 1: textType }: SerializationPair<SO, string, SS>["deserialize"],
  {
    0: binFn,
    1: binType,
  }: SerializationPair<SO, Uint8Array, SS>["deserialize"],
) =>
  ({
    text: __deserializers.txt[textType](textFn),
    binary: __deserializers.bin[binType](binFn),
  }) as SerializationRecords<HighOrderSerialize>;

const composeStop = (
  thisArg: InternalHandlerThisArg<any, any, any>,
  prevStop?: () => void,
  nextStop?: (thisArg: InternalHandlerThisArg<any, any, any>) => void,
) => {
  if (!(prevStop || nextStop)) return;
  if (!nextStop) return prevStop;
  const boundNext = nextStop.bind(0, thisArg);
  if (!prevStop) return boundNext;
  return () => {
    prevStop();
    boundNext();
  };
};

const highOrder = <CURR, SS extends {} = {}, ISP = undefined>({
  mode: nextMode,
  text,
  bin,
  mimeSubType,
  stop: nextStop,
  initState = () => {},
}: HighOrderSerializerProps<CURR, SS, ISP>) => {
  const serializers = makeSerializers(text.serialize, bin.serialize);
  const deserializers = makeDeserializers(text.deserialize, bin.deserialize);

  return <NEXT>(
    parent: SerializerRoot<NestedSerializerOpts<CURR, NEXT>, any, any>,
    initStateProps: ISP,
  ) =>
    ((shinkaOn) => {
      const parentSerializerFactory = parent(shinkaOn);

      return async (thisArg, opts) => {
        objectAssign(thisArg.state, initState(initStateProps, thisArg));
        const maybeSerializerInstance = parentSerializerFactory(thisArg, opts);

        const parentInstance =
          maybeSerializerInstance instanceof Promise
            ? await maybeSerializerInstance
            : maybeSerializerInstance;

        const {
          transportInitOpts: prevTransportInitOpts,
          typeHints,
          stop: prevStop,
        } = parentInstance;

        const { mode } = prevTransportInitOpts;

        if (mode === "not-serialized") throw new Error("invalid mode");

        const serialize = construct(
          serializers,
          mode,
          parentInstance,
          "serialize",
          thisArg,
        );

        const deserialize = construct(
          deserializers,
          mode,
          parentInstance,
          "deserialize",
          thisArg,
        );

        const mime = nextMime(prevTransportInitOpts.mime, mimeSubType);
        const transportInitOpts = { mode: nextMode, mime };
        const stop = composeStop(thisArg, prevStop, nextStop);
        return { serialize, deserialize, transportInitOpts, typeHints, stop };
      };
    }) satisfies SerializerRoot<NestedSerializerOpts<CURR, NEXT>, any, any>;
};

export default highOrder;

export type HighOrder = ReturnType<typeof highOrder>;
