import { throwTypeError } from "./common";
import { RFC9110TokenRe } from "./re";

const throwHTTP = throwTypeError("HTTP");

const escapeCodeSet = new Set([0x22, 0x5c]);

const isAllowed = (code: number) =>
  code === 0x09 || (code >= 0x20 && code <= 0x7e);

const validateCharCode = (code: number) =>
  isAllowed(code) && !escapeCodeSet.has(code);

export const RFC9110DecodeParameterValue = (value: string) => {
  if (RFC9110TokenRe.test(value)) return value;

  const chars = Array.from(value),
    lastIdx = chars.length - 1;

  if (chars.length < 2 || chars[0] !== '"' || chars[lastIdx] !== '"')
    throwHTTP();

  let i = 1,
    validator = validateCharCode,
    char = chars[1];

  while (i < lastIdx) {
    if (char === "\\") {
      chars[i] = "";
      if (++i === lastIdx) throwHTTP();
      char = chars[i];
      validator = isAllowed;
    }

    const code = char.charCodeAt(0);

    if (!validator(code)) throwHTTP();
    validator = validateCharCode;
    char = chars[++i];
  }

  chars[0] = chars[lastIdx] = "";
  return chars.join("");
};
