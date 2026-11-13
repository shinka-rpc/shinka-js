import { throwTypeError } from "./common";
import { RFC9110TokenRe, RFC9110InvalidRe } from "./re";

const throwMIME = throwTypeError("MIME");

export const RFC9110EncodeParameterValue = (value: string) => {
  if (RFC9110TokenRe.test(value)) return value;
  if (RFC9110InvalidRe.test(value)) throwMIME();
  return `"${value.replace(/(["\\])/g, "\\$1")}"`;
};
