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
} from "@shinka-rpc/core";

type SerializationPair<T> = {
  serialize: SerializerFnSync<T, any, any>;
  deserialize: DeserializerFnSync<any, any>;
};

export type HighOrderSerializerProps = {
  mode: SerializationMode;
  updateContentType: (contentType: string) => string;
  text: SerializationPair<string>;
  bin: SerializationPair<Uint8Array>;
};

const makeDeserialize =
  <T>(nextDeserializeText: (data: T) => any) =>
  (
    deserialize:
      | DeserializerFnSync<any, string>
      | DeserializerFnAsync<any, string>,
  ) =>
  (data: T) =>
    deserialize(nextDeserializeText(data));

const makeSerializerSync =
  <T extends string | Uint8Array, SO>(nextSerialize: (data: T) => any) =>
  (serialize: SerializerFnSync<any, T, SO>) =>
  (data: any) =>
    nextSerialize(serialize(data));

const makeSerializerAsync =
  <T extends string | Uint8Array, SO>(nextSerialize: (data: T) => any) =>
  (serialize: SerializerFnAsync<any, T, SO>) =>
  (data: any) =>
    serialize(data).then(nextSerialize);

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
  const { [key]: prevFn, typeHints } = instance;
  return records[mode][typeHints[key] || prevFn.constructor.name](prevFn);
};

export default ({
  mode: nextMode,
  updateContentType,
  text,
  bin,
}: HighOrderSerializerProps) => {
  const serializers = {
    text: {
      Function: makeSerializerSync(text.serialize),
      AsyncFunction: makeSerializerAsync(text.serialize),
    },
    binary: {
      Function: makeSerializerSync(bin.serialize),
      AsyncFunction: makeSerializerAsync(bin.serialize),
    },
  } as SerializationRecords<HighOrderSerialize>;

  const deserializeText = makeDeserialize(text.deserialize);
  const deserializeBin = makeDeserialize(bin.deserialize);

  const deserializers = {
    text: { Function: deserializeText, AsyncFunction: deserializeText },
    binary: { Function: deserializeBin, AsyncFunction: deserializeBin },
  } as SerializationRecords<HighOrderDeserialize>;

  return (parent: SerializerRoot<any, any, any>) =>
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

        const contentType = updateContentType(
          prevTransportInitOpts.contentType,
        );

        const transportInitOpts = { mode: nextMode, contentType };

        return { serialize, deserialize, transportInitOpts, typeHints };
      };
    }) satisfies SerializerRoot<any, any, any>;
};
