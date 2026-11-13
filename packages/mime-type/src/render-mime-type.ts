import type { StructuredMimeType } from "@shinka-rpc/core";

import {
  RFC9110EncodeParameterValue,
  RFC9110TokenRe,
} from "./rfc-9110-parameter-value";

const { entries: objectEntries } = Object;

const validateToken = (type: string, key: string) => {
  if (RFC9110TokenRe.test(key)) return key;
  throw new TypeError(`Invalid MIME ${type} "${key}"`);
};

const stringifyParametersMap = ({ 0: key, 1: value }: [string, string]) =>
  `${validateToken("parameter", key)}=${RFC9110EncodeParameterValue(value)}`;

const stringifyParameters = (parameters: [string, string][]) =>
  parameters.map(stringifyParametersMap).join("; ");

export const renderMimeType = ({
  type,
  subtype,
  parameters,
}: StructuredMimeType) => {
  const mediaType = `${validateToken("type", type)}/${validateToken("subtype", subtype)}`;

  if (!parameters) return mediaType;

  const entries = objectEntries(parameters);
  return entries.length
    ? `${mediaType}; ${stringifyParameters(entries)}`
    : mediaType;
};
