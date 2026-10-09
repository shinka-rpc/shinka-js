import { expect, test } from "@jest/globals";

import { ReusablePromise } from "../src";
import { sleep } from "../../util";

test("data-signal-void", async () => {
  const reusablePromise = new ReusablePromise<void>();
  expect(reusablePromise.isDone).toStrictEqual(false);
  const result: string[] = [];
  reusablePromise.then(() => result.push("valPromise-1"));
  await sleep(50);
  expect(reusablePromise.isDone).toStrictEqual(false);
  expect(result.length).toStrictEqual(0);
  reusablePromise.resolve();
  await reusablePromise;
  expect(reusablePromise.isDone).toStrictEqual(true);
  expect(result.length).toStrictEqual(1);
  expect(reusablePromise).resolves;
  reusablePromise.reset();
  expect(reusablePromise.isDone).toStrictEqual(false);
  reusablePromise.then(() => result.push("valPromise-2"));
  await sleep(50);
  reusablePromise.resolve();
  await reusablePromise;
  expect(reusablePromise.isDone).toStrictEqual(true);
  expect(result.length).toStrictEqual(2);
  expect(reusablePromise).resolves;
  reusablePromise.reset();
  reusablePromise.catch(() => result.push("valPromise-3"));
  await sleep(50);
  reusablePromise.reject();
  try {
    await reusablePromise;
  } catch {}
  expect(result).toStrictEqual([
    "valPromise-1",
    "valPromise-2",
    "valPromise-3",
  ]);
});
