import { expect, test } from "@jest/globals";

import {
  ClientBus,
  Response,
  ServerBus,
  type CommonBus,
  type Serializer,
} from "@shinka-rpc/core";

const mkPipe = (deley = 0) => {
  let onTimeout = (value: any) => {};
  const send = (value: any) => setTimeout(onTimeout, deley, value);
  const dispatch = (cb: (value: any) => void) => {
    onTimeout = cb;
  };
  return [send, dispatch] as [typeof send, typeof dispatch];
};

const mkPipePair = (delay1: number, delay2: number) => {
  const [send1, dispatch1] = mkPipe(delay1);
  const [send2, dispatch2] = mkPipe(delay2);
  return [
    [send1, dispatch2],
    [send2, dispatch1],
  ] as [ReturnType<typeof mkPipe>, ReturnType<typeof mkPipe>];
};

const fakeTransportClient =
  (
    pipe: ReturnType<typeof mkPipe>,
    key: string,
    results: Record<string, any>[],
  ) =>
  async (bus: ClientBus) => {
    const [send_, dispatch] = pipe;
    const close = async () => {};
    const send = (value: unknown, opts: any) => {
      results.push({ key: `${key}-transport`, opts });
      send_(value);
    };
    dispatch(bus.onMessage);
    return { send, close };
  };

const createMockSerializer = (key: string, results: Record<string, any>[]) =>
  ({
    serialize: (data: unknown, opts: any) => {
      results.push({ key: `${key}-serializer`, opts });
      return data;
    },
    deserialize: (data: unknown) => data,
  } as Serializer);

const setupTest = async () => {
  const results: Record<string, any>[] = [];

  const [pipe1to2, pipe2to1] = mkPipePair(0, 0);

  const bus1 = new ClientBus({
    factory: fakeTransportClient(pipe1to2, "bus1", results),
    serializer: createMockSerializer("bus1", results),
  });
  const bus2 = new ClientBus({
    factory: fakeTransportClient(pipe2to1, "bus2", results),
    serializer: createMockSerializer("bus2", results),
  });

  await bus1.start();
  await bus2.start();

  return {
    results,
    bus1,
    bus2,
  };
};

const createSyncHandler = (
  bus: ClientBus | ServerBus,
  results: Record<string, any>[],
) =>
  bus.onRequest(
    "bus1-sync",
    ([arg, simple, ok]: any) => {
      results.push({ key: "bus1-sync-request", arg });
      const result = simple
        ? "bus1-simple-response-send"
        : new Response("bus1-nested-response-send", {
            serialize: "bus1-sync-serialize",
            transport: "bus1-sync-transport",
          });
      if (ok) return result;
      else throw result;
    },
    {
      serialize: "bus1-sync-serialize-default",
      transport: "bus1-sync-transport-default",
    },
  );

const createMockBusService =
  (KEY: string, bus: ClientBus | CommonBus) =>
  (arg: any, simple: Boolean, ok: Boolean, withOpts: Boolean) =>
    bus.request(
      KEY,
      [arg, simple, ok],
      withOpts
        ? {
            serialize: `${KEY}-req-serialize`,
            transport: `${KEY}-req-transport`,
          }
        : undefined,
    );

test("sync-simple-ok", async () => {
  const { results, bus1, bus2 } = await setupTest();
  const bus1Sync = createMockBusService("bus1-sync", bus2);
  createSyncHandler(bus1, results);

  results.push({
    key: "bus1-sync-response-got",
    out: await bus1Sync("bus1-sync-simple-ok", true, true, true),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: "bus1-sync-req-serialize" },
    { key: "bus2-transport", opts: "bus1-sync-req-transport" },
    { key: "bus1-sync-request", arg: "bus1-sync-simple-ok" },
    { key: "bus1-serializer", opts: "bus1-sync-serialize-default" },
    { key: "bus1-transport", opts: "bus1-sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
  ]);
});

test("sync-nested-ok", async () => {
  const { results, bus1, bus2 } = await setupTest();
  const bus1Sync = createMockBusService("bus1-sync", bus2);
  createSyncHandler(bus1, results);

  results.push({
    key: "bus1-sync-response-got",
    out: await bus1Sync("bus1-sync-nested-ok", false, true, false),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "bus1-sync-request", arg: "bus1-sync-nested-ok" },
    { key: "bus1-serializer", opts: "bus1-sync-serialize" },
    { key: "bus1-transport", opts: "bus1-sync-transport" },
    { key: "bus1-sync-response-got", out: "bus1-nested-response-send" },
  ]);
});

test("sync-simple-err", async () => {
  const { results, bus1, bus2 } = await setupTest();
  const bus1Sync = createMockBusService("bus1-sync", bus2);
  createSyncHandler(bus1, results);

  try {
    await bus1Sync("bus1-sync-simple-err", true, false, false);
  } catch (e) {
    results.push({
      key: "bus1-sync-response-got",
      err: e,
    });
  }

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "bus1-sync-request", arg: "bus1-sync-simple-err" },
    { key: "bus1-serializer", opts: "bus1-sync-serialize-default" },
    { key: "bus1-transport", opts: "bus1-sync-transport-default" },
    { key: "bus1-sync-response-got", err: "bus1-simple-response-send" },
  ]);
});

test("sync-nested-err", async () => {
  const { results, bus1, bus2 } = await setupTest();
  const bus1Sync = createMockBusService("bus1-sync", bus2);
  createSyncHandler(bus1, results);

  try {
    await bus1Sync("bus1-sync-nested-err", false, false, false);
  } catch (e) {
    results.push({
      key: "bus1-sync-response-got",
      err: e,
    });
  }

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "bus1-sync-request", arg: "bus1-sync-nested-err" },
    { key: "bus1-serializer", opts: "bus1-sync-serialize" },
    { key: "bus1-transport", opts: "bus1-sync-transport" },
    { key: "bus1-sync-response-got", err: "bus1-nested-response-send" },
  ]);
});
