import { expect, test } from "@jest/globals";

import { banshee, sleep } from "@shinka-rpc/util";

test("banshee-gc", async () => {
  const testHandlers = new Set<() => void>();
  // @ts-expect-error: 7017
  globalThis.TESTHANDLERS = testHandlers;

  const results: string[] = [];
  const wail = () => results.push("wail");

  (() => {
    // force keep reference
    let clear: any = banshee([], wail);
    expect(testHandlers.size).toStrictEqual(1);
    clear = null;
  })();

  for (let i = 0; i < 5; i++) {
    // @ts-expect-error: 2722
    global.gc();
    await sleep(50);
  }

  expect(results).toStrictEqual(["wail"]);
  expect(testHandlers.size).toStrictEqual(0);
});

test("banshee-shutdown", async () => {
  const testHandlers = new Set<() => void>();
  // @ts-expect-error: 7017
  globalThis.TESTHANDLERS = testHandlers;

  const results: string[] = [];
  const wail = () => results.push("wail");

  banshee([], wail);

  expect(testHandlers.size).toStrictEqual(1);

  for (const cb of testHandlers) cb();

  for (let i = 0; i < 5; i++) {
    // @ts-expect-error: 2722
    global.gc();
    await sleep(50);
  }

  expect(results).toStrictEqual(["wail"]);
});

test("banshee-clear", async () => {
  const testHandlers = new Set<() => void>();
  // @ts-expect-error: 7017
  globalThis.TESTHANDLERS = testHandlers;

  const results: string[] = [];
  const wail = () => results.push("wail");

  await (async () => {
    const clear = banshee([], wail);
    expect(testHandlers.size).toStrictEqual(1);
    await sleep(250);
    clear();
  })();

  expect(results).toStrictEqual(["wail"]);

  for (let i = 0; i < 5; i++) {
    // @ts-expect-error: 2722
    global.gc();
    await sleep(50);
  }

  expect(results).toStrictEqual(["wail"]);
  expect(testHandlers.size).toStrictEqual(0);
});

test("banshee-clear-no-on-wail", async () => {
  const testHandlers = new Set<() => void>();
  // @ts-expect-error: 7017
  globalThis.TESTHANDLERS = testHandlers;

  const results: string[] = [];
  const wail = () => results.push("wail");

  await (async () => {
    const clear = banshee([], wail);
    expect(testHandlers.size).toStrictEqual(1);
    await sleep(250);
    clear(false);
  })();

  expect(results).toStrictEqual([]);

  for (let i = 0; i < 5; i++) {
    // @ts-expect-error: 2722
    global.gc();
    await sleep(50);
  }

  expect(results).toStrictEqual([]);
  expect(testHandlers.size).toStrictEqual(0);
});

test("banshee-not-configured", async () => {
  banshee([], () => {});
});
