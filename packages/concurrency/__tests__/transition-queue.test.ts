import { expect, test } from "@jest/globals";

import { createTransitionQueue, type TransitionQueue, Asynq } from "../src";
import { FIFO } from "../../collections";
import { sleep } from "../../util/src";

type Results = [string, string][];

const makeTask = (
  results: Results,
  tq: TransitionQueue,
  key: string,
  ok: boolean,
  wait: number | null = null,
) =>
  tq(async () => {
    results.push(["BEGIN", key]);
    wait && (await sleep(wait));
    if (ok) return key;
    throw key;
  });

test("transition-queue", async () => {
  const results: Results = [];
  const tq = createTransitionQueue(new Asynq({ items: FIFO, waiters: FIFO }));

  const ok = makeTask(results, tq, "OK", true);
  const okWait = makeTask(results, tq, "OK-WAIT", true, 75);

  const err = makeTask(results, tq, "ERR", false);
  const errWait = makeTask(results, tq, "ERR-WAIT", false, 75);

  await expect(ok()).resolves.toStrictEqual("OK");
  await expect(err()).rejects.toStrictEqual("ERR");

  //

  const promises = [okWait(), ok(), errWait(), err(), ok()];
  const settled = await Promise.allSettled(promises);

  expect(settled).toStrictEqual([
    { status: "fulfilled", value: "OK-WAIT" },
    { status: "fulfilled", value: "OK" },
    { status: "rejected", reason: "ERR-WAIT" },
    { status: "rejected", reason: "ERR" },
    { status: "fulfilled", value: "OK" },
  ]);

  expect(results).toStrictEqual([
    ["BEGIN", "OK"],
    ["BEGIN", "ERR"],
    //
    ["BEGIN", "OK-WAIT"],
    ["BEGIN", "OK"],
    ["BEGIN", "ERR-WAIT"],
    ["BEGIN", "ERR"],
    ["BEGIN", "OK"],
  ]);
});
