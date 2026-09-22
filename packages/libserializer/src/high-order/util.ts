import type {
  SerializationMode,
  SerializerInstance,
  StructuredMimeType,
  InternalHandlerThisArg,
} from "@shinka-rpc/core";

import type {
  HighOrderDeserialize,
  HighOrderSerialize,
  NestedSerializerOpts,
  SerializationRecords,
} from "./types";

import { joinMimeSubtype } from "@shinka-rpc/util";

export const construct = <
  HOSO,
  NEXT,
  T extends
    | HighOrderSerialize<NestedSerializerOpts<HOSO, NEXT>>
    | HighOrderDeserialize,
>(
  records: SerializationRecords<T>,
  mode: SerializationMode,
  instance: SerializerInstance<NEXT>,
  key: "serialize" | "deserialize",
  thisArg: InternalHandlerThisArg<NEXT, any, any>,
) => {
  const {
    [key]: prevFn,
    typeHints: { [key]: hint },
  } = instance;
  return records[mode][hint || prevFn.constructor.name](prevFn, thisArg);
};

export const nextMime = (mime: StructuredMimeType, mimeSubType: string) =>
  ({
    type: mime.type,
    subtype: joinMimeSubtype(mime.subtype, mimeSubType),
  }) satisfies StructuredMimeType;

export const compose = (
  callbacks: (() => void)[],
  dispatchError: (err: any) => void,
) => {
  return () => {
    for (const cb of callbacks) {
      try {
        cb();
      } catch (e) {
        dispatchError(e);
      }
    }
  };
};
