import { expect, test } from "@jest/globals";
import testOutScope from "../../outscope/src/tests";

import {
  Client,
  Server,
  TransportServer,
  type IBus,
  type SerializerRoot,
  type ShinkaOn,
  type TransportConnectFn,
  type TransportFactory,
} from "../src";

import {
  type mkPipe,
  mkPipePair,
  fakeTransportClient,
  // createMockSerializerAsync,
  createMockSerializerSync,
  createSyncHandler,
  createRequestBusService,
  // createAsyncHandler,
} from "./util";

type ConnectPromiseWrapped = { resolve: (bus: IBus<any, any>) => void };

const fakeTransportServer = (
  pipe: ReturnType<typeof mkPipe>,
  key: string,
  results: Record<string, any>[],
) => {
  const tf: TransportFactory<any, any, any, null> = async (
    thisArg,
    onRawData,
    onClosed,
    opts,
  ) => {
    const { 0: send_, 1: dispatch } = pipe;
    const close = async () => {};
    const send = (value: unknown, opts: any) => {
      results.push({ key: `${key}-transport`, opts });
      send_(value);
    };
    dispatch(onRawData);
    return { send, close, instruction: {}, context: null };
  };
  return ((
    shinkaOn: ShinkaOn<any, any, any>,
    connect: TransportConnectFn<any, any, any, null>,
    eventListeners,
  ) => {
    eventListeners.add("started", connect.bind(0, tf));
    eventListeners.remove("started", console.log);
  }) satisfies TransportServer<any, any, any, any>;
};

const setupClientServer = async (
  createSerializer: (
    key: string,
    results: Record<string, any>[],
  ) => SerializerRoot<any, any, any>,
) => {
  const { outscope, outscopeState } = testOutScope();
  const results: Record<string, any>[] = [];

  const { 0: pipe1to2, 1: pipe2to1 } = mkPipePair(0, 0);

  const client = new Client({
    outscope,
    transport: fakeTransportClient(pipe1to2, "client1", results),
    serializer: createSerializer("client1", results),
  });

  client.addEventListener("connected", () =>
    results.push({ key: "client1-event", val: "connect" }),
  );

  client.addEventListener("disconnected", () =>
    results.push({ key: "client1-event", val: "disconnect" }),
  );

  const connectPromiseHandler: ConnectPromiseWrapped = {
    resolve: console.warn,
  };

  const connectPromise = new Promise<IBus<any, any>>((resolve, reject) => {
    connectPromiseHandler.resolve = resolve;
  });

  const server = new Server({
    outscope,
    transport: fakeTransportServer(pipe2to1, "server", results),
    serializer: createSerializer("server", results),
  });

  server.addEventListener("connected", (bus) => {
    connectPromiseHandler.resolve(bus);
    results.push({ key: "server-event", val: "connect" });
  });

  server.addEventListener("disconnected", () =>
    results.push({ key: "server-event", val: "disconnect" }),
  );

  server.start();

  await client.start();
  const bus = await connectPromise;

  return { results, client, server, bus };
};

test("server", async () => {
  const { results, client, server, bus } = await setupClientServer(
    createMockSerializerSync,
  );
  createSyncHandler("server-sync", server, results);
  const clientSync = createRequestBusService("server-sync");

  createSyncHandler("client-sync", client, results);
  const busSync = createRequestBusService("client-sync");

  results.push({
    key: "client-sync-response-got",
    out: await clientSync(client, "client-sync", true, true, true),
  });

  results.push({
    key: "bus-sync-response-got",
    out: await busSync(bus, "bus-sync", true, true, true),
  });

  server.size;

  await client.stop();
  // await bus.stop();
  await server.stop();

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
