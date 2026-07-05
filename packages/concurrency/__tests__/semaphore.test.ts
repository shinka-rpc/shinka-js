import { Semaphore, type SemaphoreAcquireContext } from "../src";
import { expect, test } from "@jest/globals";

import { FIFO } from "../../collections";
import { sleep } from "../../util";

const mkPushAt =
  <T>(slots: T[]) =>
  (idx: number) =>
  (val: T) =>
    (slots[idx] = val);

test("semaphore", async () => {
  const s = new Semaphore({ waiters: FIFO, count: 2 });

  const slots: (SemaphoreAcquireContext | null)[] = [
    null,
    null,
    null,
    null,
    null,
  ];

  const pushAt = mkPushAt(slots);

  const acquireAll = () => {
    s.acquire().then(pushAt(0));
    s.acquire().then(pushAt(1));
    s.acquire().then(pushAt(2));
    s.acquire().then(pushAt(3));
    s.acquire().then(pushAt(4));
  };

  expect(s.value).toStrictEqual(2);

  acquireAll();

  expect(s.value).toStrictEqual(0);

  await sleep(100);
  expect(slots.map(Boolean)).toStrictEqual([true, true, false, false, false]);

  slots[0]!.release();

  await sleep(10);

  expect(s.value).toStrictEqual(0);

  expect(slots.map(Boolean)).toStrictEqual([true, true, true, false, false]);

  // slots[1] skipped

  slots[2]!.release();

  await sleep(10);

  expect(slots.map(Boolean)).toStrictEqual([true, true, true, true, false]);

  slots[3]!.release();

  await sleep(10);

  expect(slots.map(Boolean)).toStrictEqual([true, true, true, true, true]);

  slots[4]!.release();

  expect(s.value).toStrictEqual(1);

  slots[1]!.release();
  await sleep(10);
  expect(s.value).toStrictEqual(2);

  expect(slots[0]!.release).toThrow();

  // ===

  slots.fill(null);

  acquireAll();
  await sleep(100);

  // Check the state is not corrupted
  expect(slots.map(Boolean)).toStrictEqual([true, true, false, false, false]);

  s.count = 1; // try shrink
  slots[0]!.release();
  await sleep(10);

  // same
  expect(slots.map(Boolean)).toStrictEqual([true, true, false, false, false]);

  s.count = 10; // try grow
  await sleep(10);
  expect(slots.map(Boolean)).toStrictEqual([true, true, true, true, true]);

  for (let i = 1; i < 5; i++) slots[i]!.release();
  await sleep(10);
});
