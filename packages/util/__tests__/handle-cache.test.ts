import { expect, test, jest } from "@jest/globals";

import { handleCache } from "../src";

type Results = [string, any][];

test("handle-cache", () => {
  const results: Results = [];
  const cache = new Map<number, number>();
  const factoryFn = (n: number) => {
    results.push(["FACTORY", n]);
    return n ** 2;
  };
  const callFor = (n: number) => {
    results.push(["CALL", n]);
    results.push(["RESULT", handleCache(cache, factoryFn, n)]);
  };
  callFor(2);
  callFor(3);
  callFor(2);

  expect(results).toStrictEqual([
    ["CALL", 2],
    ["FACTORY", 2],
    ["RESULT", 4],
    ["CALL", 3],
    ["FACTORY", 3],
    ["RESULT", 9],
    ["CALL", 2],
    ["RESULT", 4],
  ]);
});

test("handle-cache-undefined", () => {
  const cache = new Map<string, undefined>();
  const factory = jest.fn(() => undefined);

  expect(handleCache(cache, factory, "key")).toBeUndefined();
  expect(handleCache(cache, factory, "key")).toBeUndefined();

  expect(factory).toHaveBeenCalledTimes(1);
});
