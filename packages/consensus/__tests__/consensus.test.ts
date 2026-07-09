import { expect, test } from "@jest/globals";

import { consensus, Consensus } from "../src";

const pairMap = new Map<Consensus, Consensus>([
  [Consensus.OK, Consensus.FAIL],
  [Consensus.FAIL, Consensus.OK],
  [Consensus.UNKNOWN, Consensus.UNKNOWN],
]);

const testPair = (a: number, b: number) => {
  const consensusResult = consensus(a, b);
  expect(consensus(b, a)).toStrictEqual(pairMap.get(consensusResult));
};

const testRange = (a1: number, a2: number, b1: number, b2: number) => {
  for (let a = a1; a < a2; a++) for (let b = b1; b < b2; b++) testPair(a, b);
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
  expect(consensus(a, b)).toStrictEqual(Consensus.OK);
  expect(consensus(b, a)).toStrictEqual(Consensus.FAIL);
});

(
  [
    [0, 0],
    [2000, 2000],
    // chosen by fair dice roll
    [7116, 32129],
    [27554, 12762],
    [2881, 7265],
    [29987, 25308],
  ] as [number, number][]
).forEach(runTest(100));
