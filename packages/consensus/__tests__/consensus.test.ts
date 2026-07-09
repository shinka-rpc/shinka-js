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

const test100 = (x: number) => testRange(x, x + 100);

test("consensus-exact", () => {
  expect(1).toStrictEqual(1);
  const a = 1;
  const b = 2;
  expect(consensus(a, b)).toStrictEqual(Consensus.OK);
  expect(consensus(b, a)).toStrictEqual(Consensus.FAIL);
});

test("consensus-range-0-100", () => test100(0));
test("consensus-range-2000-2100", () => test100(2000));

// chosen by fair dice roll
test("consensus-range-7116-7216", () => test100(7116));
test("consensus-range-12762-12862", () => test100(12762));
test("consensus-range-27554-27654", () => test100(27554));
test("consensus-range-32129-32229", () => test100(32129));
