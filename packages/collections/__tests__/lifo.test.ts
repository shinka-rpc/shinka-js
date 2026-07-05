import { LIFO } from "../src";
import { expect, test } from "@jest/globals";

test("lifo", () => {
  const q = new LIFO<number>();
  const input: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
  const output: number[] = [];

  input.forEach(q.push);

  const mapped = q.map((i) => i);
  expect(input).toStrictEqual(mapped.reverse());

  const forEach: number[] = [];
  q.forEach((i) => forEach.push(i));
  expect(input).toStrictEqual(forEach.reverse());

  const forOf: number[] = [];
  for (const val of q) forOf.push(val);
  expect(input).toStrictEqual(forOf.reverse());

  while (q.length) output.push(q.pop()!);
  expect(input).toStrictEqual(output.reverse());
  expect(q.pop()).toStrictEqual(undefined);

  input.forEach(q.push);
  expect(input.length).toStrictEqual(q.length);

  q.length = 4;

  const truncated: number[] = [];
  while (q.length) truncated.push(q.pop()!);
  expect(input.slice(4).reverse()).toStrictEqual(truncated);
});
