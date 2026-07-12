import { expect, test } from "@jest/globals";
import outscope from "../../outscope/src/tests";

import {
  Client,
  Hub,
  TransportFactory,
  type SerializerRoot,
} from "@shinka-rpc/core";

import { createHandlerRegistries } from "../src/shinka";

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

  const client = new Client({
    outscope,
    transport: fakeTransportClient(pipe1to2, "client1", results),
    serializer: createSerializer("client1", results),
  });

  const hub = new Hub({ outscope });

  client.addEventListener("connect", () =>
    results.push({ key: "client1-event", val: "connect" }),
  );

  client.addEventListener("disconnect", () =>
    results.push({ key: "client1-event", val: "disconnect" }),
  );

  hub.addEventListener("connect", () =>
    results.push({ key: "hub-event", val: "connect" }),
  );

  hub.addEventListener("disconnect", () =>
    results.push({ key: "hub-event", val: "disconnect" }),
  );

  const serializerHandlers = createHandlerRegistries<any, any, any>();
  const serializer = createSerializer("hub", results)(serializerHandlers);

  const tf: TransportFactory<any, any, any> = async (thisArg, onRawData) => {
    const [send, dispatch] = pipe2to1;
    dispatch(onRawData);
    const close = async () => {};
    return { send, close, instruction: {} };
  };

  const start = async () => {
    await client.start();
    return await hub.connect({
      transport: [undefined, tf],
      serializer: [serializerHandlers, serializer],
    });
  };

  return { results, client, hub, start };
};

test("hub-classic", async () => {
  const { results, client, hub, start } = await setupClientHub(
    createMockSerializerSync,
  );
  createSyncHandler("bus1-sync", hub, results);
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
    { key: "hub-event", val: "connect" },
    { key: "client1-serializer-sync", opts: "bus1-sync-req-serialize" },
    { key: "client1-transport", opts: "bus1-sync-req-transport" },
    { key: "sync-request", arg: "client-sync-classic-ok" },
    { key: "hub-serializer-sync", opts: "sync-serialize-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
    { key: "client1-event", val: "disconnect" },
    { key: "hub-event", val: "disconnect" },
  ]);
});

test("hub-reverse", async () => {
  const { results, client, hub, start } = await setupClientHub(
    createMockSerializerSync,
  );
  createSyncHandler("bus1-sync", client, results);
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
    { key: "hub-event", val: "connect" },
    { key: "hub-serializer-sync", opts: "bus1-sync-req-serialize" },
    { key: "sync-request", arg: "client-sync-reverse-ok" },
    { key: "client1-serializer-sync", opts: "sync-serialize-default" },
    { key: "client1-transport", opts: "sync-transport-default" },
    { key: "bus1-sync-response-got", out: "bus1-simple-response-send" },
    { key: "client1-event", val: "disconnect" },
    { key: "hub-event", val: "disconnect" },
  ]);
});
