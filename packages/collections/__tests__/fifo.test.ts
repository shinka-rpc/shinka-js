import { FIFO } from "../src";
import { expect, test } from "@jest/globals";

test("fifo", () => {
  const q = new FIFO<number>();
  const input: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
  const output: number[] = [];

  input.forEach(q.push);
  expect(q.length).toStrictEqual(input.length);

  const mapped = q.map((i) => i);
  expect(input).toStrictEqual(mapped);

  const arrayFrom = Array.from(q);
  expect(input).toStrictEqual(arrayFrom);

  const forEach: number[] = [];
  q.forEach((i) => forEach.push(i));
  expect(input).toStrictEqual(forEach);

  const forOf: number[] = [];
  for (const val of q) forOf.push(val);
  expect(input).toStrictEqual(forOf);

  while (q.length) output.push(q.pop()!);
  expect(input).toStrictEqual(output);
  expect(q.pop()).toStrictEqual(undefined);
  expect(q.length).toStrictEqual(0);

  input.forEach(q.push);
  expect(input.length).toStrictEqual(q.length);
  expect(q.length).toStrictEqual(input.length);

  const IDX = 5;

  q.truncate(IDX);

  const truncated: number[] = [];
  while (q.length) truncated.push(q.pop()!);
  expect(input.slice(q.length - IDX)).toStrictEqual(truncated);

  q.truncate();
  expect(q.length).toStrictEqual(0);

  expect(() => q.truncate(-1)).toThrow();

  q.push(-1);
  q.push(-2);
  expect(q.length).toStrictEqual(2);
  expect([...q]).toStrictEqual([-1, -2]);

  q.truncate();
  expect(q.length).toStrictEqual(0);
  expect(q.map((i) => i)).toStrictEqual([]);
});
