import { expect, test } from "@jest/globals";
import { NBAcquire } from "../../core";
import { sleep } from "../../util";
import { createProtocol, cmpResolver } from "../../consensus";
import {
  defaultExclusiveLock,
  createExclusiveLock,
  type AnyNBThisArg,
} from "../src";

import { createMockNBThisArg, type Log } from "./util";
import type { FIFO } from "../../collections/src";

test("local-acquire-release-ok-5", async () => {
  const { actions, thisArg } = createMockNBThisArg(defaultExclusiveLock);
  for (let i = 0; i < 5; i++) {
    const acquirePromise = thisArg.lock.acquire(
      thisArg,
      NBAcquire.SERIALIZER,
      50,
    );
    await sleep(0); // Promise.resolve doesn't work
    expect(acquirePromise).resolves;
    thisArg.lock.on.accept(thisArg);
    {
      await using acquireCtx = await acquirePromise;
      actions.push({ action: "acquired" });
    }
    await Promise.resolve();
    actions.push({ action: "released" });
  }
  thisArg.lock.stop(thisArg);
  await sleep(200);
  // console.log([...actions]);
});

test("remote-acquire-release-ok-5", async () => {
  const { actions, thisArg } = createMockNBThisArg(defaultExclusiveLock);
  for (let i = 0; i < 5; i++) {
    const nonces = thisArg.state.base.protocol[0]();
    thisArg.lock.on.acquire(thisArg, NBAcquire.SERIALIZER, 50, nonces);
    await Promise.resolve();
    actions.push({ action: "acquired" });
    thisArg.lock.on.release(thisArg);
    await Promise.resolve();
    actions.push({ action: "released" });
  }
  thisArg.lock.stop(thisArg);
  await sleep(200);
  // console.log([...actions]);
});

const nextFn =
  <T>(iter: Iterator<T>) =>
  () =>
    iter.next().value;

const repeat = function* <T>(arr: T[]) {
  while (1) for (const val of arr) yield val;
};

const arrIter = <T>(arr: T[]) => nextFn(repeat(arr));

const releaseFn = (thisArg: AnyNBThisArg, actions: FIFO<Log>) => {
  actions.push({ action: "remote-release-sent" });
  thisArg.lock.on.release(thisArg);
};

const genericRaceTest = async (
  ownInts: number[],
  opponentInts: number[],
  repeats: number,
  won: boolean,
) => {
  const protocolUW = createProtocol({
    nonceLength: 1,
    resolver: cmpResolver,
    randInt32: arrIter(ownInts),
  });

  const opponent = arrIter(opponentInts);

  const lockUW = createExclusiveLock({ protocol: protocolUW });

  const { actions, thisArg } = createMockNBThisArg(lockUW);
  const goRelease = releaseFn.bind(0, thisArg, actions);

  for (let i = 0; i < repeats; i++) {
    const acquirePromise = thisArg.lock.acquire(
      thisArg,
      NBAcquire.TRANSPORT,
      100,
    );
    await sleep(0); // Promise.resolve doesn't work
    thisArg.lock.on.acquire(thisArg, NBAcquire.SERIALIZER, 100, [opponent()]);
    await sleep(0); // Promise.resolve doesn't work
    thisArg.lock.on.acquire(thisArg, NBAcquire.SERIALIZER, 100, [opponent()]);
    await sleep(0); // Promise.resolve doesn't work
    won ? setTimeout(goRelease, 50) : goRelease();
    {
      await using acquireCtx = await acquirePromise;
      actions.push({ action: "acquired" });
    }
    await sleep(0);
    actions.push({ action: "released" });
  }
  thisArg.lock.stop(thisArg);
  await sleep(200);
  return actions;
};

test("race-unknown-won-5", async () => {
  const actions = await genericRaceTest([1, 2], [1, 0], 5, true);
  // console.log([...actions]);
});

test("race-unknown-lose-5", async () => {
  const actions = await genericRaceTest([1, 0], [1, 2], 5, false);
  // console.log([...actions]);
});
