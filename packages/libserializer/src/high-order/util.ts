import type {
  SerializationMode,
  SerializerInstance,
  StructuredMimeType,
  InternalHandlerThisArg,
} from "@shinka-rpc/core";

import type {
  HighOrderDeserialize,
  HighOrderSerialize,
  SerializationRecords,
} from "./types";

import { joinMimeSubtype } from "@shinka-rpc/util";

export const construct = <T extends HighOrderSerialize | HighOrderDeserialize>(
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

export const nextMime = (mime: StructuredMimeType, mimeSubType: string) =>
  ({
    type: mime.type,
    subtype: joinMimeSubtype(mime.subtype, mimeSubType),
  }) satisfies StructuredMimeType;

export const composeStop = (
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
