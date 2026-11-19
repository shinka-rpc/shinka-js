import { expect, test } from "@jest/globals";
import { makeSlowTransport, cropSeq } from "./util-concurrency";
import { sleep } from "../../util";

test("concurrency-client", async () => {
  const { journal, promise, lifecycle, suite, client, outscopeState } =
    makeSlowTransport();

  // 1. A repeated "stop" while in the STOPPED state: must be safe.
  suite.stop.q("stop-idle-1");
  suite.stop.q("stop-idle-2");
  await suite.stop.all("all-stop-1");

  // 2. Multiple "start" commands during the STARTING state.
  suite.start.q("start-1");
  suite.start.q("start-2");
  await sleep(0);

  // We are requesting a stop and a restart while the init process is not yet
  // complete.
  suite.stop.q("stop-during-start");
  suite.start.q("start-during-start");

  await sleep(0);
  promise.init.resolve();

  // All "start" operations queued at this stage.
  await suite.start.all("all-start-2");

  // A stop may be awaiting a "close".
  await sleep(0);
  promise.close.resolve();
  await suite.stop.all("all-stop-3");

  // 3. New start during the STOPPING state.
  // The previous stop has been completed, so we reset 'close'.
  promise.close.reset();
  promise.init.reset();

  suite.start.q("start-before-stop");
  promise.init.resolve();
  await suite.start.all("all-start-4");

  // Initiate the stop and hold it in the "close" position.
  promise.close.reset();
  suite.stop.q("stop-hold-close");
  await sleep(0);

  // While 'stop' is waiting for 'close', we request several operations.
  suite.start.q("start-during-stop-1");
  suite.restart.q("restart-during-stop");
  suite.stop.q("stop-during-stop");

  await sleep(0);
  promise.close.resolve();
  await suite.stop.all("all-stop-5");

  // Startup and restart may wait for a new init.
  promise.init.reset();
  promise.close.reset();
  promise.init.resolve();

  await suite.start.all("all-start-6");
  await suite.restart.all("all-restart-7");

  // 4. Final stop: the client must be reusable.
  suite.stop.q("final-stop");
  await sleep(0);
  promise.close.resolve();
  await suite.stop.all("all-stop-8");

  // TODO: FSM-based log analysis is still required
  expect(journal.for.bus.length).toBeGreaterThan(0);
});

test("concurrency-client-init-failure", async () => {
  const { journal, promise, lifecycle, suite } = makeSlowTransport();

  suite.start.q("start-1");
  suite.start.q("start-2");
  await sleep(0);

  suite.stop.q("stop-during-start-failure");
  await sleep(0);

  promise.init.reject("reject-init-1");

  await suite.start.all("all-start-1");
  await suite.stop.all("all-stop-2");

  // After an unsuccessful start, the client should allow for a new attempt.
  promise.init.reset();
  promise.close.reset();

  suite.start.q("retry-start");
  await sleep(0);
  promise.init.resolve();
  await suite.start.all("all-start-3");

  suite.stop.q("cleanup");
  await sleep(0);
  promise.close.resolve();
  await suite.stop.all("all-stop-4");

  // TODO: FSM-based log analysis is still required
  expect(journal.for.bus.length).toBeGreaterThan(0);
});

test("concurrency-client-close-failure", async () => {
  const { journal, promise, lifecycle, suite } = makeSlowTransport();

  suite.start.q("initial-start");
  await sleep(0);
  promise.init.resolve();
  await suite.start.all("all-start-1");

  promise.close.reset();

  suite.stop.q("stop-1");
  suite.stop.q("stop-2");
  await sleep(0);

  promise.close.reject("reject-stop-1");
  await suite.stop.all("all-stop-2");

  // After a closure error, we check whether a restart is possible.
  promise.init.reset();
  promise.close.reset();

  suite.start.q("retry-start");
  await sleep(0);
  promise.init.resolve();
  await suite.start.all("all-start-3");

  suite.stop.q("final-stop");
  await sleep(0);
  promise.close.resolve();
  await suite.stop.all("all-stop-4");

  // TODO: FSM-based log analysis is still required
  expect(journal.for.bus.length).toBeGreaterThan(0);
});
