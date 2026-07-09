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

const testRange = (x: number, y: number) => {
  for (let a = x; a < y; a++) for (let b = x; b < y; b++) testPair(a, b);
};

test("consensus-exact", () => {
  expect(1).toStrictEqual(1);
  const a = 1;
  const b = 2;
  expect(consensus(a, b)).toStrictEqual(Consensus.OK);
  expect(consensus(b, a)).toStrictEqual(Consensus.FAIL);
});

test("consensus-range-0-250", () => testRange(0, 250));
test("consensus-range-250-500", () => testRange(250, 500));
test("consensus-range-500-750", () => testRange(500, 750));
