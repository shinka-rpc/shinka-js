import { expect, test } from "@jest/globals";

import { clearObject, curryClearObject } from "../src";

test("clear-object", () => {
  const example = { a: 1, b: 2, c: 3 };
  clearObject(example);
  expect(Object.keys(example)).toStrictEqual([]);
});

test("curry-clear-object", () => {
  const example = { a: 1, b: 2, c: 3 };
  const clear = curryClearObject(example);
  expect(new Set(Object.keys(example))).toStrictEqual(new Set(["a", "b", "c"]));
  clear();
  expect(Object.keys(example)).toStrictEqual([]);
});
