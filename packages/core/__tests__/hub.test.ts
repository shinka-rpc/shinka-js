import { expect, test } from "@jest/globals";

import {
  ClientBus,
  Hub,
  type SerializerRoot,
  type Factories,
} from "@shinka-rpc/core";

import {
  mkPipePair,
  fakeTransportClient,
  // createMockSerializerAsync,
  createMockSerializerSync,
  createSyncHandler,
  createMockBusService,
  // createAsyncHandler,
} from "./util";

const setupClientHub = async (
  createSerializer: (
    key: string,
    results: Record<string, any>[],
  ) => SerializerRoot<any, any, any>,
) => {
  const results: Record<string, any>[] = [];

  const [pipe1to2, pipe2to1] = mkPipePair(0, 0);

  const client = new ClientBus({
    transport: fakeTransportClient(pipe1to2, "client1", results),
    serializer: createSerializer("client1", results),
  });
  const hub = new Hub({});

  client.addEventListener("connect", () =>
    results.push({ key: "client1-event", val: "connect" }),
  );

  client.addEventListener("disconnect", () =>
    results.push({ key: "client1-event", val: "disconnect" }),
  );

  hub.addEventListener("connect", () =>
    results.push({ key: "server-event", val: "connect" }),
  );

  hub.addEventListener("disconnect", () =>
    results.push({ key: "server-event", val: "disconnect" }),
  );

  const [serializer, serializerHandlers] = createSerializer(
    "server",
    results,
  )();

  const factories: Factories<any, any> = {
    serializer,
    transport: async (onRawData) => {
      const [send, dispatch] = pipe2to1;
      dispatch(onRawData);
      const close = async () => {};
      return { send, close, instruction: {} };
    },
  };
  const handlerRegistries = {
    serializer: serializerHandlers,
  };

  const start = async () => {
    await client.start();

    const common = await hub.connect({ factories, handlerRegistries });

    return common;
  };

  return { results, client, hub, start };
};

// === server

test("server-classic", async () => {
  const { results, client, hub, start } = await setupClientHub(
    createMockSerializerSync,
  );
  createSyncHandler(hub, results);
  const clientService = createMockBusService("bus1-sync", client);
  const common = await start();

  results.push({
    key: "bus1-sync-response-got",
    out: await clientService("client-sync-classic-ok", true, true, true),
  });

  await client.stop();
  await common.stop();

  expect(results).toStrictEqual([
    { key: "client1-event", val: "connect" },
    { key: "server-event", val: "connect" },
    { key: "client1-serializer-sync", opts: "bus1-sync-req-serialize" },
    { key: "client1-transport", opts: "bus1-sync-req-transport" },
    { key: "sync-request", arg: "client-sync-classic-ok" },
    { key: "server-serializer-sync", opts: "sync-serialize-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
    { key: "client1-event", val: "disconnect" },
    { key: "server-event", val: "disconnect" },
  ]);
});

test("server-reverse", async () => {
  const { results, client, hub, start } = await setupClientHub(
    createMockSerializerSync,
  );
  createSyncHandler(client, results);
  const common = await start();
  const commonService = createMockBusService("bus1-sync", common);

  results.push({
    key: "bus1-sync-response-got",
    out: await commonService("client-sync-reverse-ok", true, true, true),
  });

  await client.stop();
  await common.stop();

  expect(results).toStrictEqual([
    { key: "client1-event", val: "connect" },
    { key: "server-event", val: "connect" },
    { key: "server-serializer-sync", opts: "bus1-sync-req-serialize" },
    { key: "sync-request", arg: "client-sync-reverse-ok" },
    { key: "client1-serializer-sync", opts: "sync-serialize-default" },
    { key: "client1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
    { key: "client1-event", val: "disconnect" },
    { key: "server-event", val: "disconnect" },
  ]);
});
