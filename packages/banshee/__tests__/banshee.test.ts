import { expect, test } from "@jest/globals";

import { banshee } from "../src";
import { testListeners } from "../src/banshee-for-test";

import { sleep } from "../../util";

test("banshee-gc", async () => {
  const results: string[] = [];
  const wail = () => results.push("wail");

  (() => {
    // force keep reference
    const clears = [banshee([], wail)];
    expect(testListeners.size).toStrictEqual(1);
    clears.pop();
  })();

  for (let i = 0; i < 5; i++) {
    global.gc!();
    await sleep(50);
  }

  expect(results).toStrictEqual(["wail"]);
  expect(testListeners.size).toStrictEqual(0);
});

test("banshee-shutdown", async () => {
  const results: string[] = [];
  const wail = () => results.push("wail");

  banshee([], wail);

  expect(testListeners.size).toStrictEqual(1);

  for (const cb of testListeners) cb();

  for (let i = 0; i < 5; i++) {
    global.gc!();
    await sleep(50);
  }

  expect(results).toStrictEqual(["wail"]);
  expect(testListeners.size).toStrictEqual(0);
});

test("banshee-clear", async () => {
  const results: string[] = [];
  const wail = () => results.push("wail");

  await (async () => {
    const clear = banshee([], wail);
    expect(testListeners.size).toStrictEqual(1);
    await sleep(250);
    clear();
  })();

  expect(results).toStrictEqual(["wail"]);

  for (let i = 0; i < 5; i++) {
    global.gc!();
    await sleep(50);
  }

  expect(results).toStrictEqual(["wail"]);
  expect(testListeners.size).toStrictEqual(0);
});

test("banshee-clear-no-on-wail", async () => {
  const results: string[] = [];
  const wail = () => results.push("wail");

  await (async () => {
    const clear = banshee([], wail);
    expect(testListeners.size).toStrictEqual(1);
    await sleep(250);
    clear(false);
  })();

  expect(results).toStrictEqual([]);

  for (let i = 0; i < 5; i++) {
    global.gc!();
    await sleep(50);
  }

  expect(results).toStrictEqual([]);
  expect(testListeners.size).toStrictEqual(0);
});

test("banshee-not-configured", async () => {
  banshee([], () => {});
});
