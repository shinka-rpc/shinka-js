import { expect, test } from "@jest/globals";

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
