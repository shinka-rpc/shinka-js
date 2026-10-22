import { Asynq } from "../src";
import { expect, test } from "@jest/globals";

import { FIFO } from "../../collections";
import { sleep } from "../../util";

test("asynq", async () => {
  const q = new Asynq<number>({ items: FIFO, waiters: FIFO });

  const slots: (number | null)[] = [null, null, null, null, null];

  const pushAt = (idx: number) => (val: number) => (slots[idx] = val);

  q.pop().then(pushAt(0));
  q.pop().then(pushAt(1));
  q.pop().then(pushAt(2));
  q.pop().then(pushAt(3));
  q.pop().then(pushAt(4));

  await sleep(100);

  expect(slots).toStrictEqual([null, null, null, null, null]);

  q.push(1);

  await sleep(10);

  expect(slots).toStrictEqual([1, null, null, null, null]);

  q.push(2);
  q.push(3);
  q.push(4);
  q.push(5);

  await sleep(10);
  expect(slots).toStrictEqual([1, 2, 3, 4, 5]);
});
