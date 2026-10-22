import { Semaphore } from "../src";
import type { DisposeContext } from "../../util";
import { expect, test } from "@jest/globals";

import { FIFO } from "../../collections";
import { sleep } from "../../util";

const mkPushAt =
  <T>(slots: T[]) =>
  (idx: number) =>
  (val: T) =>
    (slots[idx] = val);

test("semaphore", async () => {
  const s = new Semaphore({ waiters: FIFO, capacity: 2 });

  const slots: (DisposeContext | null)[] = [null, null, null, null, null];

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

  slots[0]!.dispose();

  await sleep(10);

  expect(s.value).toStrictEqual(0);

  expect(slots.map(Boolean)).toStrictEqual([true, true, true, false, false]);

  // slots[1] skipped

  slots[2]!.dispose();

  await sleep(10);

  expect(slots.map(Boolean)).toStrictEqual([true, true, true, true, false]);

  slots[3]!.dispose();

  await sleep(10);

  expect(slots.map(Boolean)).toStrictEqual([true, true, true, true, true]);

  slots[4]!.dispose();

  expect(s.value).toStrictEqual(1);

  slots[1]!.dispose();
  await sleep(10);
  expect(s.value).toStrictEqual(2);

  expect(slots[0]!.dispose).toThrow();

  // ===

  {
    using ctx = await s.acquire();
    expect(s.value).toStrictEqual(1);
  }
  expect(s.value).toStrictEqual(2);

  // ===

  slots.fill(null);

  acquireAll();
  await sleep(100);

  // Check the state is not corrupted
  expect(slots.map(Boolean)).toStrictEqual([true, true, false, false, false]);

  expect(s.value).toStrictEqual(0);
  s.capacity = 1; // try shrink
  expect(s.value).toStrictEqual(-1);
  slots[0]!.dispose();
  await sleep(10);
  expect(s.value).toStrictEqual(0);

  // same
  expect(slots.map(Boolean)).toStrictEqual([true, true, false, false, false]);

  s.capacity = 10; // try grow
  await sleep(10);
  expect(slots.map(Boolean)).toStrictEqual([true, true, true, true, true]);

  for (let i = 1; i < 5; i++) slots[i]!.dispose();
  await sleep(10);
  expect(s.value).toStrictEqual(10);
});
