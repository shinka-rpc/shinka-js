import { expect, test } from "@jest/globals";
import testOutScope from "../../outscope/src/tests";
import { defaultExclusiveLock } from "../../exclusive-lock/src";
import { sleep } from "../../util";

import {
  Client,
  SerializerRoot,
  InternalHandlerThisArg,
  ExclusiveLock,
} from "../src";

import {
  mkPipePair,
  fakeTransportClient,
  createMockSerializerAsync,
  createMockSerializerSync,
  createSyncHandler,
  createSyncDataEventHandler,
  createRequestBusService,
  createEventBusService,
  createAsyncDataEventHandler,
  createAsyncHandler,
} from "./util";

type TAs = {
  t1: InternalHandlerThisArg<any, any, any>;
  s1: InternalHandlerThisArg<any, any, any>;
  t2: InternalHandlerThisArg<any, any, any>;
  s2: InternalHandlerThisArg<any, any, any>;
};

type TestSerializerFactory<TO> = (
  key: string,
  results: Record<string, any>[],
  setThisArg?: (TA: InternalHandlerThisArg<any, any, any>) => void,
) => SerializerRoot<any, TO, any>;

const setupClientClient = async <TO>(
  createSerializer: TestSerializerFactory<TO>,
  delays: [number, number] = [0, 0],
  lock: ExclusiveLock<any, any, any> | undefined = undefined,
) => {
  const { outscope, outscopeState } = testOutScope();
  const results: Record<string, any>[] = [];
  const TA = {} as any as TAs;

  const setTA =
    (key: keyof TAs) => (val: InternalHandlerThisArg<any, any, any>) => {
      TA[key] = val;
    };

  const { 0: pipe1to2, 1: pipe2to1 } = mkPipePair(...delays);

  const bus1 = new Client({
    outscope,
    transport: fakeTransportClient(pipe1to2, "bus1", results, setTA("t1")),
    serializer: createSerializer("bus1", results, setTA("s1")),
    responseTimeout: 1000,
    lock,
  });
  const bus2 = new Client({
    outscope,
    transport: fakeTransportClient(pipe2to1, "bus2", results, setTA("t2")),
    serializer: createSerializer("bus2", results, setTA("s2")),
    responseTimeout: 1000,
    lock,
  });

  bus1.extra.bus = 1;
  bus2.extra.bus = 2;

  const errorHandler = (key: string) => (bus: Client<any, any>, data: any) =>
    results.push([`${key}-dispatched-error`, data]);

  bus1.addEventListener("error", errorHandler("bus1"));
  bus2.addEventListener("error", errorHandler("bus2"));

  bus1.addEventListener("connected", () =>
    results.push({ key: "bus1-event", val: "connect" }),
  );

  bus1.addEventListener("disconnected", () =>
    results.push({ key: "bus1-event", val: "disconnect" }),
  );

  bus2.addEventListener("connected", () =>
    results.push({ key: "bus2-event", val: "connect" }),
  );

  bus2.addEventListener("disconnected", () =>
    results.push({ key: "bus2-event", val: "disconnect" }),
  );

  const start = async () => {
    await bus1.start();
    await bus2.start();
  };

  const stop = async () => {
    await bus1.stop();
    await bus2.stop();
  };

  return { results, bus1, bus2, start, stop, TA, outscopeState };
};

// === sync

test("sync-simple-ok", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );
  const bus1SyncReq = createRequestBusService("bus1-sync");
  const bus1SyncEv = createEventBusService("bus1-event");

  createSyncHandler("bus1-sync", bus1, results);
  createSyncDataEventHandler("bus1-event", bus1, results);

  expect(() => bus2.dataEvent(0, 0)).toThrow();

  await start();

  await bus1.start();

  bus1SyncEv(bus2, "event:bus2->bus1", true, false);

  // Yes, twice await 0
  await sleep(0);
  await sleep(0);

  results.push({
    key: "bus1-sync-response-got",
    out: await bus1SyncReq(bus2, "bus1-sync-simple-ok", true, true, true),
  });

  await bus1.ping();

  await bus1.restart();

  await stop();

  await bus1.stop();
  bus1.removeEventListener("error", console.error);

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "data-event", arg: "event:bus2->bus1" },
    { key: "bus2-serializer-sync", opts: "bus1-sync-req-serialize" },
    { key: "bus2-transport", opts: "bus1-sync-req-transport" },
    { key: "sync-request", arg: "bus1-sync-simple-ok" },
    { key: "bus1-serializer-sync", opts: "sync-serialize-default" },
    { key: "bus1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
    { key: "bus1-serializer-sync", opts: undefined },
    { key: "bus1-transport", opts: undefined },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus1-event", val: "connect" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

test("sync-simple-ok-serializer-async", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerAsync,
  );
  const bus1SyncReq = createRequestBusService("bus1-sync");
  createSyncHandler("bus1-sync", bus1, results);
  await start();

  results.push({
    key: "bus1-sync-response-got",
    out: await bus1SyncReq(bus2, "bus1-sync-simple-ok", true, true, true),
  });

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-async", opts: "bus1-sync-req-serialize" },
    { key: "bus2-transport", opts: "bus1-sync-req-transport" },
    { key: "sync-request", arg: "bus1-sync-simple-ok" },
    { key: "bus1-serializer-async", opts: "sync-serialize-default" },
    { key: "bus1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

test("sync-nested-ok", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );
  const bus1SyncReq = createRequestBusService("bus1-sync");
  createSyncHandler("bus1-sync", bus1, results);
  await start();

  results.push({
    key: "bus1-sync-response-got",
    out: await bus1SyncReq(bus2, "bus1-sync-nested-ok", false, true, false),
  });

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "sync-request", arg: "bus1-sync-nested-ok" },
    { key: "bus1-serializer-sync", opts: "sync-serialize" },
    { key: "bus1-transport", opts: "sync-transport" },
    { key: "bus1-sync-response-got", out: "nested-response-send" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

test("sync-simple-err", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );

  const bus1SyncReq = createRequestBusService("bus1-sync");
  createSyncHandler("bus1-sync", bus1, results);
  const bus1SyncEv = createEventBusService("bus1-sync");
  createSyncDataEventHandler("bus1-sync", bus1, results);

  await start();

  try {
    results.push([
      "bus1-sync-response-got",
      await bus1SyncReq(bus2, "bus1-sync-simple-err", true, false, false),
    ]);
  } catch (e) {
    results.push({
      key: "bus1-sync-response-err",
      err: e,
    });
  }

  bus1SyncEv(bus2, "bus1-sync-ev-error", false, false);

  await sleep(0);
  await sleep(0);

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "sync-request", arg: "bus1-sync-simple-err" },
    { key: "bus1-serializer-sync", opts: "sync-serialize-default" },
    { key: "bus1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-err", err: "bus1-simple-response-send" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "data-event", arg: "bus1-sync-ev-error" },
    ["bus1-dispatched-error", "bus1-sync-ev-error"],
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

test("sync-nested-err", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );
  const bus1SyncReq = createRequestBusService("bus1-sync");
  createSyncHandler("bus1-sync", bus1, results);
  await start();

  try {
    await bus1SyncReq(bus2, "bus1-sync-nested-err", false, false, false);
  } catch (e) {
    results.push({
      key: "bus1-sync-response-got",
      err: e,
    });
  }

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "sync-request", arg: "bus1-sync-nested-err" },
    { key: "bus1-serializer-sync", opts: "sync-serialize" },
    { key: "bus1-transport", opts: "sync-transport" },
    { key: "bus1-sync-response-got", err: "nested-response-send" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

// === async

test("async-simple-ok", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );
  const bus1SyncReq = createRequestBusService("bus1-async");
  createAsyncHandler("bus1-async", bus1, results);
  await start();

  results.push({
    key: "bus1-async-response-got",
    out: await bus1SyncReq(bus2, "bus1-async-simple-ok", true, true, false),
  });

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-simple-ok" },
    { key: "bus1-serializer-sync", opts: "async-serialize-default" },
    { key: "bus1-transport", opts: "async-transport-default" },
    { key: "bus1-async-response-got", out: "simple-response-send" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

test("async-nested-ok", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );
  const bus1SyncReq = createRequestBusService("bus1-async");
  createAsyncHandler("bus1-async", bus1, results);
  await start();

  results.push({
    key: "bus1-async-response-got",
    out: await bus1SyncReq(bus2, "bus1-async-nested-ok", false, true, false),
  });

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-nested-ok" },
    { key: "bus1-serializer-sync", opts: "async-serialize" },
    { key: "bus1-transport", opts: "async-transport" },
    { key: "bus1-async-response-got", out: "nested-response-send" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

test("async-simple-err", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );
  const bus1SyncReq = createRequestBusService("bus1-async");
  createAsyncHandler("bus1-async", bus1, results);
  const bus1AsyncEv = createEventBusService("bus1-async");
  createAsyncDataEventHandler("bus1-async", bus1, results);
  await start();

  try {
    await bus1SyncReq(bus2, "bus1-async-simple-err", true, false, false);
  } catch (e) {
    results.push({
      key: "bus1-async-response-got",
      err: e,
    });
  }

  bus1AsyncEv(bus2, "bus1-async-ev-error", false, false);

  await sleep(0);
  await sleep(0);

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-simple-err" },
    { key: "bus1-serializer-sync", opts: "async-serialize-default" },
    { key: "bus1-transport", opts: "async-transport-default" },
    { key: "bus1-async-response-got", err: "simple-response-send" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "data-event", arg: "bus1-async-ev-error" },
    ["bus1-dispatched-error", "bus1-async-ev-error"],
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

test("async-nested-err", async () => {
  const { results, bus1, bus2, start, stop } = await setupClientClient(
    createMockSerializerSync,
  );
  const bus1SyncReq = createRequestBusService("bus1-async");
  createAsyncHandler("bus1-async", bus1, results);
  await start();

  try {
    await bus1SyncReq(bus2, "bus1-async-nested-err", false, false, false);
  } catch (e) {
    results.push({
      key: "bus1-async-response-got",
      err: e,
    });
  }

  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-nested-err" },
    { key: "bus1-serializer-sync", opts: "async-serialize" },
    { key: "bus1-transport", opts: "async-transport" },
    { key: "bus1-async-response-got", err: "nested-response-send" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});

// === exclusive-lock

test("exclusive-lock-ok", async () => {
  const { results, bus1, bus2, start, stop, TA } = await setupClientClient(
    createMockSerializerSync,
    undefined,
    defaultExclusiveLock,
  );
  const bus1SyncReq = createRequestBusService("bus1-sync");
  createSyncHandler("bus1-sync", bus1, results);
  await start();

  let handlerPromise: Promise<unknown>;

  {
    await using s1AcquireCTX = await TA.s1.exclusiveLock(100);
    handlerPromise = bus1SyncReq(
      bus2,
      "bus1-sync-simple-ok",
      true,
      true,
      true,
    ).then((out) => results.push({ key: "bus1-sync-response-got", out }));
    results.push({ key: "bus1-lock-got" });
  }

  await handlerPromise;
  await stop();

  expect(results).toStrictEqual([
    { key: "bus1-event", val: "connect" },
    { key: "bus2-event", val: "connect" },
    { key: "bus1-serializer-sync", opts: undefined },
    { key: "bus1-transport", opts: undefined },
    { key: "bus2-serializer-sync", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "bus1-lock-got" },
    { key: "bus1-serializer-sync", opts: undefined },
    { key: "bus1-transport", opts: undefined },
    { key: "bus2-serializer-sync", opts: "bus1-sync-req-serialize" },
    { key: "bus2-transport", opts: "bus1-sync-req-transport" },
    { key: "sync-request", arg: "bus1-sync-simple-ok" },
    { key: "bus1-serializer-sync", opts: "sync-serialize-default" },
    { key: "bus1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
    { key: "bus1-event", val: "disconnect" },
    { key: "bus2-event", val: "disconnect" },
  ]);
});
