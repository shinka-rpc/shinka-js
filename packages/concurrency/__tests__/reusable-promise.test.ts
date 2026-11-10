import { expect, test } from "@jest/globals";

import { ReusablePromise } from "../src";
import { sleep } from "../../util";

test("reusable-promise-void", async () => {
  const reusablePromise = new ReusablePromise<void>();
  expect(reusablePromise.isDone).toStrictEqual(false);
  const result: string[] = [];
  reusablePromise.then(() => result.push("valPromise-1"));
  reusablePromise.finally(() => result.push("valPromise-finally"));
  await sleep(0);
  expect(reusablePromise.isDone).toStrictEqual(false);
  expect(result.length).toStrictEqual(0);
  reusablePromise.resolve();
  await reusablePromise;
  expect(reusablePromise.isDone).toStrictEqual(true);
  expect(result.length).toStrictEqual(2);
  expect(reusablePromise).resolves;
  reusablePromise.reset();
  reusablePromise.reset();
  expect(reusablePromise.isDone).toStrictEqual(false);
  reusablePromise.then(() => result.push("valPromise-2"));
  await sleep(0);
  reusablePromise.resolve();
  await reusablePromise;
  expect(reusablePromise.isDone).toStrictEqual(true);
  expect(result.length).toStrictEqual(3);
  expect(reusablePromise).resolves;
  reusablePromise.reset();
  reusablePromise.catch(() => result.push("valPromise-3"));
  await sleep(0);
  reusablePromise.reject();
  try {
    await reusablePromise;
  } catch {}
  expect(result).toStrictEqual([
    "valPromise-1",
    "valPromise-finally",
    "valPromise-2",
    "valPromise-3",
  ]);
});
