import { expect, test } from "@jest/globals";

import { delegate } from "@shinka-rpc/util";

test("delegate-1-arg", () => {
  const results: [string, number][] = [];

  const createFn = (name: string) => (n: number) => results.push([name, n]);

  const defaultFn = createFn("default");
  const otherFn = createFn("other");

  const { call, set, reset } = delegate(defaultFn);

  call(1);
  set(otherFn);
  call(2);
  reset();
  call(3);

  expect(results).toStrictEqual([
    ["default", 1],
    ["other", 2],
    ["default", 3],
  ]);
});

test("delegate-4-args", () => {
  const results: [string, number, number, number, number][] = [];

  const createFn =
    (name: string) => (n1: number, n2: number, n3: number, n4: number) =>
      results.push([name, n1, n2, n3, n4]);

  const defaultFn = createFn("default");
  const otherFn = createFn("other");

  const { call, set, reset } = delegate(defaultFn);

  call(0, 1, 2, 3);
  set(otherFn);
  call(4, 5, 6, 7);
  reset();
  call(8, 9, 0, 1);

  expect(results).toStrictEqual([
    ["default", 0, 1, 2, 3],
    ["other", 4, 5, 6, 7],
    ["default", 8, 9, 0, 1],
  ]);
});
