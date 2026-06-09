import { expect, test } from "@jest/globals";

import {
  Client,
  Server,
  type Bus,
  type SerializerRoot,
  type ShinkaOnBus,
  type TransportConnectFnBus,
  type TransportFactory,
  type SerializedData,
  type TransportInitOpts,
} from "@shinka-rpc/core";

import {
  type mkPipe,
  mkPipePair,
  fakeTransportClient,
  // createMockSerializerAsync,
  createMockSerializerSync,
  createSyncHandler,
  createMockBusService,
  // createAsyncHandler,
} from "./util";

type ConnectPromiseWrapped = { resolve: (bus: Bus<any, any>) => void };

const fakeTransportServer = (
  pipe: ReturnType<typeof mkPipe>,
  key: string,
  results: Record<string, any>[],
) => {
  const tf: TransportFactory<any, any> = async (
    onRawData: (data: SerializedData) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    const [send_, dispatch] = pipe;
    const close = async () => {};
    const send = (value: unknown, opts: any) => {
      results.push({ key: `${key}-transport`, opts });
      send_(value);
    };
    dispatch(onRawData);
    return { send, close, instruction: {} };
  };
  return (
    shinkaOn: ShinkaOnBus<any, any>,
    connect: TransportConnectFnBus<any, any>,
  ) => setTimeout(connect, 0, tf);
};

const setupClientServer = async (
  createSerializer: (
    key: string,
    results: Record<string, any>[],
  ) => SerializerRoot<any, any, any>,
) => {
  const results: Record<string, any>[] = [];

  const [pipe1to2, pipe2to1] = mkPipePair(0, 0);

  const client = new Client({
    transport: fakeTransportClient(pipe1to2, "client1", results),
    serializer: createSerializer("client1", results),
  });

  client.addEventListener("connect", () =>
    results.push({ key: "client1-event", val: "connect" }),
  );

  client.addEventListener("disconnect", () =>
    results.push({ key: "client1-event", val: "disconnect" }),
  );

  const connectPromiseHandler: ConnectPromiseWrapped = {
    resolve: console.warn,
  };

  const connectPromise = new Promise<Bus<any, any>>((resolve, reject) => {
    connectPromiseHandler.resolve = resolve;
  });

  const server = new Server({
    transport: fakeTransportServer(pipe2to1, "server", results),
    serializer: createSerializer("server", results),
  });

  server.addEventListener("connect", (bus) => {
    connectPromiseHandler.resolve(bus);
    results.push({ key: "server-event", val: "connect" });
  });

  server.addEventListener("disconnect", () =>
    results.push({ key: "server-event", val: "disconnect" }),
  );

  await client.start();
  const bus = await connectPromise;

  return { results, client, server, bus };
};

test("server", async () => {
  const { results, client, server, bus } = await setupClientServer(
    createMockSerializerSync,
  );
  createSyncHandler("server-sync", server, results);
  const clientSync = createMockBusService("server-sync", client);

  createSyncHandler("client-sync", client, results);
  const busSync = createMockBusService("client-sync", bus);

  results.push({
    key: "client-sync-response-got",
    out: await clientSync("client-sync", true, true, true),
  });

  results.push({
    key: "bus-sync-response-got",
    out: await busSync("bus-sync", true, true, true),
  });

  await client.stop();
  await bus.stop();

  expect(results).toStrictEqual([
    { key: "client1-event", val: "connect" },
    { key: "server-event", val: "connect" },
    { key: "client1-serializer-sync", opts: "server-sync-req-serialize" },
    { key: "client1-transport", opts: "server-sync-req-transport" },
    { key: "sync-request", arg: "client-sync" },
    { key: "server-serializer-sync", opts: "sync-serialize-default" },
    { key: "server-transport", opts: "sync-transport-default" },
    { key: "client-sync-response-got", out: "bus1-simple-response-send" },
    { key: "server-serializer-sync", opts: "client-sync-req-serialize" },
    { key: "server-transport", opts: "client-sync-req-transport" },
    { key: "sync-request", arg: "bus-sync" },
    { key: "client1-serializer-sync", opts: "sync-serialize-default" },
    { key: "client1-transport", opts: "sync-transport-default" },
    { key: "bus-sync-response-got", out: "bus1-simple-response-send" },
    { key: "client1-event", val: "disconnect" },
    { key: "server-event", val: "disconnect" },
  ]);
});
