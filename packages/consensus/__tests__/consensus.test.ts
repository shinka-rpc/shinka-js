import { expect, test } from "@jest/globals";

import { defaultResolver, Consensus, reflection } from "../src";

const testPair = (a: number, b: number) => {
  const consensusResult = defaultResolver(a, b);
  expect(defaultResolver(b, a)).toStrictEqual(reflection(consensusResult));
  return consensusResult === Consensus.UNKNOWN;
};

const testRange = (a1: number, a2: number, b1: number, b2: number) => {
  const stat = { all: 0, collision: 0 };
  for (let a = a1; a < a2; a++) {
    for (let b = b1; b < b2; b++) {
      if (a === b) continue;
      stat.all++;
      stat.collision += +testPair(a, b);
    }
  }
  expect(stat.collision / stat.all).toBeLessThan(0.001);
};

const testN = (N: number, a: number, b: number) =>
  testRange(a, a + N, b, b + N);

const runTest =
  (N: number) =>
  ([a, b]: [number, number]) =>
    test(`consensus-range-${N}-${a}-${b}`, () => testN(N, a, b));

// ===

test("consensus-exact-1-2", () => {
  expect(1).toStrictEqual(1);
  const a = 1;
  const b = 2;
  expect(defaultResolver(a, b)).toStrictEqual(Consensus.WON);
  expect(defaultResolver(b, a)).toStrictEqual(Consensus.LOSE);
});

(
  [
    [0, 0],
    // [2000, 2000],
    // chosen by fair dice roll
    // [7116, 32129],
    // [27554, 12762],
    // [2881, 7265],
    // [29987, 25308],
  ] as [number, number][]
).forEach(runTest(100));
