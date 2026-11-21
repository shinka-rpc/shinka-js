import { expect, test } from "@jest/globals";

import { SortedQueue } from "../src/adaptive/sorted-queue";
import { qPush10 } from "./q-push-10";

test("sorted-queue-asc", () => {
  const q = new SortedQueue((a: number, b: number) => a - b);
  q.truncate();
  expect(q.pop()).toBeUndefined();
  qPush10(q);
  expect(q.length).toBe(10);
  expect([...q]).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(
    q.map((i, ta) => {
      expect(ta).toBe(q);
      return i;
    }),
  ).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const res: number[] = [];

  q.forEach((i, ta) => {
    expect(ta).toBe(q);
    res.push(i);
  });

  expect(res).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  expect(q.pop()).toBe(9);
  q.truncate(5);
  expect([...q]).toStrictEqual([0, 1, 2, 3, 4]);

  q.truncate();
  expect(q.length).toBe(0);
});

test("sorted-queue-desc", () => {
  const q = new SortedQueue((a: number, b: number) => b - a);
  qPush10(q);
  expect([...q]).toStrictEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
  expect(q.pop()).toBe(0);
  q.truncate(5);
  expect([...q]).toStrictEqual([9, 8, 7, 6, 5]);
});
