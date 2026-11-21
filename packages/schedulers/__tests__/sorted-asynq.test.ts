import { sortedAsynq } from "../src/adaptive/sorted-asynq";
import { expect, test } from "@jest/globals";

import { FIFO } from "../../collections/src";
import { sleep } from "../../util/src";

import { qPush10 } from "./q-push-10";

const cmpAsc = (a: number, b: number) => a - b;

test("sorted-asynq", async () => {
  const q = sortedAsynq({ comparator: cmpAsc, waiters: FIFO });
  const slots = [, , ,] as (number | undefined)[];

  const setAt = (idx: number) => (val: number) => (slots[idx] = val);
  q.pop().then(setAt(0));
  q.pop().then(setAt(1));
  q.pop().then(setAt(2));

  await sleep(0);

  expect(slots).toStrictEqual([, , ,]);

  q.push(3);
  q.push(1);
  q.push(2);

  await sleep(0);

  expect(q.length).toBe(0);

  qPush10(q);

  expect([...q]).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  await expect(q.pop()).resolves.toBe(9);
  await expect(q.pop()).resolves.toBe(8);
  await expect(q.pop()).resolves.toBe(7);
});
