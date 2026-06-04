import { expect, test } from "@jest/globals";

import { DataSignal, sleep } from "@shinka-rpc/util";

test("data-signal-void", async () => {
  const signal = new DataSignal<void>();
  expect(signal.isSet()).toStrictEqual(false);
  const result: string[] = [];
  let valPromise = signal.wait();
  valPromise.then(() => result.push("valPromise-1"));
  await sleep(50);
  expect(signal.isSet()).toStrictEqual(false);
  expect(result.length).toStrictEqual(0);
  signal.set();
  await valPromise;
  expect(signal.isSet()).toStrictEqual(true);
  expect(result.length).toStrictEqual(1);
  expect(signal.wait()).resolves;
  signal.reset();
  expect(signal.isSet()).toStrictEqual(false);
  valPromise = signal.wait();
  valPromise.then(() => result.push("valPromise-2"));
  await sleep(50);
  signal.set();
  await valPromise;
  expect(signal.isSet()).toStrictEqual(true);
  expect(result.length).toStrictEqual(2);
  expect(signal.wait()).resolves;
});
