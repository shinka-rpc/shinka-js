import { expect, test } from "@jest/globals";

import { sequence } from "../src";

test("sequence-default", () => {
  const seq = sequence();
  const results = [seq(), seq(), seq(), seq()];
  expect(results).toStrictEqual([0, 1, 2, 3]);
});

test("sequence-from-5", () => {
  const seq = sequence(5);
  const results = [seq(), seq(), seq(), seq()];
  expect(results).toStrictEqual([5, 6, 7, 8]);
});
