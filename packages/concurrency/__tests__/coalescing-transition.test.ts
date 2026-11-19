import {
  createCoalescingTransition,
  type CoalescingTransition,
  ReusablePromise,
} from "../src";
import { expect, test } from "@jest/globals";

type Results = [string, string][];
type Mutual = {
  active: number;
  max: number;
};

const addTransitionFn = (
  results: Results,
  mutual: Mutual,
  coalescingTransition: CoalescingTransition<string>,
  state: string,
) => {
  const promise = new ReusablePromise<void>();
  const transition = coalescingTransition(
    `${state}-target`,
    `${state}-pending`,
    async () => {
      results.push([state, "CALL"]);
      mutual.active++;
      mutual.max = Math.max(mutual.max, mutual.active);
      try {
        await promise;
      } finally {
        mutual.active--;
      }
    },
    results.push.bind(results, [state, "BEGIN"]),
    results.push.bind(results, [state, "OK"]),
    (err: any) => results.push([`${state}/ERR`, err]),
  );
  return { transition, promise };
};

type Mutable = {
  throw: boolean;
  throwValue: any;
};

const addSyncFn = (
  results: Results,
  coalescingTransition: CoalescingTransition<string>,
  state: string,
) => {
  const mutable: Mutable = { throw: false, throwValue: null };
  const transition = coalescingTransition(
    `${state}-target`,
    `${state}-pending`,
    () => {
      results.push([state, "SYNC-CALL"]);
      if (mutable.throw) throw mutable.throwValue;
    },
    results.push.bind(results, [state, "BEGIN"]),
    results.push.bind(results, [state, "OK"]),
    (err: any) => results.push([`${state}/ERR`, err]),
  );
  return { mutable, transition };
};

test("coalescing-transition", async () => {
  const results: Results = [];
  const mutual: Mutual = { active: 0, max: 0 };
  const { 0: getState, 1: transition } = createCoalescingTransition("b-target");
  const a = addTransitionFn(results, mutual, transition, "a");
  const b = addTransitionFn(results, mutual, transition, "b");
  const c = addTransitionFn(results, mutual, transition, "c");

  const s = addSyncFn(results, transition, "s");

  const s2j = b.transition(); // -2
  const s1j = b.transition(); // -1
  const s0 = b.transition();

  await expect(s2j).resolves.toBeUndefined();
  await expect(s1j).resolves.toBeUndefined();
  await expect(s0).resolves.toBeUndefined();

  expect(getState()).toStrictEqual("b-target");

  const s1 = a.transition();
  const s2 = a.transition();
  await Promise.resolve();
  a.promise.resolve();
  await expect(s1).resolves.toBeUndefined();
  await expect(s2).resolves.toBeUndefined();
  await expect(a.transition()).resolves.toBeUndefined();
  a.promise.reset();
  const s3 = b.transition();
  const s4 = b.transition();
  const s5 = c.transition();
  const s6 = c.transition();
  await Promise.resolve();
  b.promise.reject();
  await expect(s3).rejects.toBeUndefined();
  await expect(s4).rejects.toBeUndefined();
  b.promise.reset();

  c.promise.resolve();
  await expect(s5).resolves.toBeUndefined();
  await expect(s6).resolves.toBeUndefined();
  await Promise.resolve();
  const s7 = b.transition();
  const s8 = b.transition();
  await Promise.resolve();
  b.promise.resolve();
  await expect(s7).resolves.toBeUndefined();
  await expect(s8).resolves.toBeUndefined();
  b.promise.reset();

  const s9 = a.transition();
  const s10 = a.transition();
  await Promise.resolve();
  a.promise.reject();
  await expect(s9).rejects.toBeUndefined();
  await expect(s10).rejects.toBeUndefined();
  a.promise.reset();

  await expect(b.transition()).resolves.toBeUndefined();

  const s11 = a.transition();
  const s12 = a.transition();
  await Promise.resolve();
  a.promise.resolve();
  await expect(s11).resolves.toBeUndefined();
  await expect(s12).resolves.toBeUndefined();

  s.mutable.throw = true;
  await expect(s.transition()).rejects.toStrictEqual(s.mutable.throwValue);
  s.mutable.throw = false;
  await expect(s.transition()).resolves.toBeUndefined();
  await expect(s.transition()).resolves.toBeUndefined();

  expect(results).toStrictEqual([
    ["a", "BEGIN"],
    ["a", "CALL"],
    ["a", "OK"],
    ["b", "BEGIN"],
    ["b", "CALL"],
    ["b/ERR", undefined],
    ["c", "BEGIN"],
    ["c", "CALL"],
    ["c", "OK"],
    ["b", "BEGIN"],
    ["b", "CALL"],
    ["b", "OK"],
    ["a", "BEGIN"],
    ["a", "CALL"],
    ["a/ERR", undefined],
    ["a", "BEGIN"],
    ["a", "CALL"],
    ["a", "OK"],
    ["s", "BEGIN"],
    ["s", "SYNC-CALL"],
    ["s/ERR", null],
    ["s", "BEGIN"],
    ["s", "SYNC-CALL"],
    ["s", "OK"],
  ]);

  expect(mutual.active).toStrictEqual(0);
  expect(mutual.max).toStrictEqual(1);
});
