import { expect, test } from "@jest/globals";

import {
  RFC9110DecodeParameterValue,
  RFC9110EncodeParameterValue,
} from "../src";

const VALID = [
  ["hello", "hello"],
  ["my document", '"my document"'],
  ["a;b", '"a;b"'],
  ['a"b', '"a\\"b"'],
  ["a\\b", '"a\\\\b"'],
  ["", '""'],
  ["\\", '"\\\\\"'],
  ["\\\\", '"\\\\\\\\"'],
  ['"', '"\\""'],
];

const VALID_DECODED = [
  ["d", '"\\d"'],
  [" ", '"\\ "'],
  ["\t", '"\\\t"'],
];

const DEC_ARRAYS = [VALID, VALID_DECODED] as const;

const INVALID = [
  '"',
  '"""',
  '"\\',
  '"\\"',
  '"ttttt',
  'ttttt"',
  '"\\\u0000"',
  '"\u0000"',
  '"\u007f"',
  "Юникод",
];

test("rfc-9110-parameter-value-encoder", () => {
  for (const { 0: enc, 1: dec } of VALID) {
    expect(RFC9110EncodeParameterValue(enc)).toStrictEqual(dec);
  }
  expect(() => RFC9110EncodeParameterValue("\u0000")).toThrow(
    new TypeError("Invalid MIME parameter value"),
  );
});

test("rfc-9110-parameter-value-decoder", () => {
  for (const ARR of DEC_ARRAYS) {
    for (const { 0: enc, 1: dec } of ARR) {
      expect(RFC9110DecodeParameterValue(dec)).toStrictEqual(enc);
    }
  }

  for (const i of INVALID) {
    try {
      expect(() => RFC9110DecodeParameterValue(i)).toThrow(
        new TypeError("Invalid HTTP parameter value"),
      );
    } catch (e) {
      console.error(i);
      throw e;
    }
  }
});
