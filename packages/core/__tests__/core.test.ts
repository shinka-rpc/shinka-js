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

const setupClientClient = async () => {
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

  return { results, bus1, bus2 };
};

const setupClientServer = async () => {
  const results: Record<string, any>[] = [];

  const [pipe1to2, pipe2to1] = mkPipePair(0, 0);

  const client = new ClientBus({
    factory: fakeTransportClient(pipe1to2, "client1", results),
    serializer: createMockSerializer("client1", results),
  });
  const server = new ServerBus({
    serializer: createMockSerializer("server", results),
  });

  const common = await server.connect({
    factory: async (bus) => {
      const [send, dispatch] = pipe2to1;
      dispatch(bus.onMessage);
      const close = async () => {};
      return { send, close };
    },
  });

  await client.start();
  // await server.start();

  return { results, client, server, common };
};

const createSyncHandler = (
  bus: ClientBus | ServerBus,
  results: Record<string, any>[],
) =>
  bus.onRequest(
    "bus1-sync",
    ([arg, simple, ok]: any) => {
      results.push({ key: "sync-request", arg });
      const result = simple
        ? "bus1-simple-response-send"
        : new Response("nested-response-send", {
            serialize: "sync-serialize",
            transport: "sync-transport",
          });
      if (ok) return result;
      else throw result;
    },
    {
      serialize: "sync-serialize-default",
      transport: "sync-transport-default",
    },
  );

const createAsyncHandler = (
  bus: ClientBus | ServerBus,
  results: Record<string, any>[],
) =>
  bus.onRequest(
    "bus1-async",
    async ([arg, simple, ok]: any) => {
      results.push({ key: "async-request", arg });
      const result = simple
        ? "simple-response-send"
        : new Response("nested-response-send", {
            serialize: "async-serialize",
            transport: "async-transport",
          });
      if (ok) return result;
      else throw result;
    },
    {
      serialize: "async-serialize-default",
      transport: "async-transport-default",
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

// === sync

test("sync-simple-ok", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
  const bus1Sync = createMockBusService("bus1-sync", bus2);
  createSyncHandler(bus1, results);

  results.push({
    key: "bus1-sync-response-got",
    out: await bus1Sync("bus1-sync-simple-ok", true, true, true),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: "bus1-sync-req-serialize" },
    { key: "bus2-transport", opts: "bus1-sync-req-transport" },
    { key: "sync-request", arg: "bus1-sync-simple-ok" },
    { key: "bus1-serializer", opts: "sync-serialize-default" },
    { key: "bus1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
  ]);
});

test("sync-nested-ok", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
  const bus1Sync = createMockBusService("bus1-sync", bus2);
  createSyncHandler(bus1, results);

  results.push({
    key: "bus1-sync-response-got",
    out: await bus1Sync("bus1-sync-nested-ok", false, true, false),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "sync-request", arg: "bus1-sync-nested-ok" },
    { key: "bus1-serializer", opts: "sync-serialize" },
    { key: "bus1-transport", opts: "sync-transport" },
    { key: "bus1-sync-response-got", out: "nested-response-send" },
  ]);
});

test("sync-simple-err", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
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
    { key: "sync-request", arg: "bus1-sync-simple-err" },
    { key: "bus1-serializer", opts: "sync-serialize-default" },
    { key: "bus1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", err: "bus1-simple-response-send" },
  ]);
});

test("sync-nested-err", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
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
    { key: "sync-request", arg: "bus1-sync-nested-err" },
    { key: "bus1-serializer", opts: "sync-serialize" },
    { key: "bus1-transport", opts: "sync-transport" },
    { key: "bus1-sync-response-got", err: "nested-response-send" },
  ]);
});

// === async

test("async-simple-ok", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
  const bus1Sync = createMockBusService("bus1-async", bus2);
  createAsyncHandler(bus1, results);

  results.push({
    key: "bus1-async-response-got",
    out: await bus1Sync("bus1-async-simple-ok", true, true, false),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-simple-ok" },
    { key: "bus1-serializer", opts: "async-serialize-default" },
    { key: "bus1-transport", opts: "async-transport-default" },
    { key: "bus1-async-response-got", out: "simple-response-send" },
  ]);
});

test("async-nested-ok", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
  const bus1Sync = createMockBusService("bus1-async", bus2);
  createAsyncHandler(bus1, results);

  results.push({
    key: "bus1-async-response-got",
    out: await bus1Sync("bus1-async-nested-ok", false, true, false),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-nested-ok" },
    { key: "bus1-serializer", opts: "async-serialize" },
    { key: "bus1-transport", opts: "async-transport" },
    { key: "bus1-async-response-got", out: "nested-response-send" },
  ]);
});

test("async-simple-err", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
  const bus1Sync = createMockBusService("bus1-async", bus2);
  createAsyncHandler(bus1, results);

  try {
    await bus1Sync("bus1-async-simple-err", true, false, false);
  } catch (e) {
    results.push({
      key: "bus1-async-response-got",
      err: e,
    });
  }

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-simple-err" },
    { key: "bus1-serializer", opts: "async-serialize-default" },
    { key: "bus1-transport", opts: "async-transport-default" },
    { key: "bus1-async-response-got", err: "simple-response-send" },
  ]);
});

test("async-nested-err", async () => {
  const { results, bus1, bus2 } = await setupClientClient();
  const bus1Sync = createMockBusService("bus1-async", bus2);
  createAsyncHandler(bus1, results);

  try {
    await bus1Sync("bus1-async-nested-err", false, false, false);
  } catch (e) {
    results.push({
      key: "bus1-async-response-got",
      err: e,
    });
  }

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: undefined },
    { key: "bus2-transport", opts: undefined },
    { key: "async-request", arg: "bus1-async-nested-err" },
    { key: "bus1-serializer", opts: "async-serialize" },
    { key: "bus1-transport", opts: "async-transport" },
    { key: "bus1-async-response-got", err: "nested-response-send" },
  ]);
});

// === server

test("server-classic", async () => {
  const { results, client, server, common } = await setupClientServer();
  createSyncHandler(server, results);
  const clientService = createMockBusService("bus1-sync", client);

  results.push({
    key: "bus1-sync-response-got",
    out: await clientService("client-sync-classic-ok", true, true, true),
  });

  expect(results).toStrictEqual([
    { key: "client1-serializer", opts: "bus1-sync-req-serialize" },
    { key: "client1-transport", opts: "bus1-sync-req-transport" },
    { key: "sync-request", arg: "client-sync-classic-ok" },
    { key: "server-serializer", opts: "sync-serialize-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
  ]);
});

test("server-reverse", async () => {
  const { results, client, server, common } = await setupClientServer();
  createSyncHandler(client, results);
  const commonService = createMockBusService("bus1-sync", common);

  results.push({
    key: "bus1-sync-response-got",
    out: await commonService("client-sync-reverse-ok", true, true, true),
  });

  expect(results).toStrictEqual([
    { key: "server-serializer", opts: "bus1-sync-req-serialize" },
    { key: "sync-request", arg: "client-sync-reverse-ok" },
    { key: "client1-serializer", opts: "sync-serialize-default" },
    { key: "client1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
  ]);
});
