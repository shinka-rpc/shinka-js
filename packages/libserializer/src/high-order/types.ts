import type {
  SerializerFn,
  DeserializerFn,
  SerializationMode,
  FnConstructorName,
  InternalHandlerThisArg,
  SerializedData,
} from "@shinka-rpc/core";

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

export type SerializationPair<SO, T extends string | Uint8Array, SS> = {
  serialize: [HighOrderSerializerFn<T, any, SO, SS>, FnConstructorName];
  deserialize: [HighOrderDeserializerFn<any, any, SO, SS>, FnConstructorName];
};

export type SerializationRecords<T> = Record<
  SerializationMode,
  Record<FnConstructorName, T>
>;

export type NestedSerializerOpts<CURR, NEXT> = {
  curr: CURR;
  next: NEXT;
};

export type HighOrderSerialize = <SO>(
  serialize: SerializerFn<any, any, SO>,
  thisArg: InternalHandlerThisArg<SO, any, any>,
) => SerializerFn<any, any, SO>;

export type HighOrderDeserialize = (
  deserialize: DeserializerFn<any, any>,
  thisArg: InternalHandlerThisArg<any, any, any>,
) => DeserializerFn<any, any>;
