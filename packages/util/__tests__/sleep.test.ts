import { expect, test, jest } from "@jest/globals";

import { sleep } from "../src";

test("sleep-ok", async () => {
  await expect(sleep(0)).resolves.toBeUndefined();
});

test("sleep-abort", async () => {
  const abort = new AbortController();
  const promise = sleep(0, { signal: abort.signal });
  abort.abort("test");
  await expect(promise).rejects.toStrictEqual("test");
});

test("sleep-abort-pre", async () => {
  const abort = new AbortController();
  abort.abort("test");
  const promise = sleep(0, { signal: abort.signal });
  await expect(promise).rejects.toStrictEqual("test");
});

test("sleep-abort-cleanup", async () => {
  jest.useFakeTimers();

  try {
    const abort = new AbortController();
    const promise = sleep(1000, { signal: abort.signal });

    abort.abort("test");

    await expect(promise).rejects.toStrictEqual("test");
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

test("sleep-abort-after-resolve", async () => {
  const abort = new AbortController();

  await expect(sleep(0, { signal: abort.signal })).resolves.toBeUndefined();

  abort.abort("test");
});
