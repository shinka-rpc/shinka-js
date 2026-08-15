import { expect, test } from "@jest/globals";
import outscope from "../../outscope/src/tests";
import { sequence, sleep } from "../../util";
import { Asynq } from "../../concurrency";
import { FIFO } from "../../collections";
import {
  Server,
  Pool,
  type ShinkaOn,
  type TransportConnectFn,
  type TransportFactory,
  type IBus,
  type InternalHandlerThisArg,
  type TransportClient,
} from "../src";

import {
  type mkPipe,
  mkPipePair,
  // createMockSerializerAsync,
  // createMockSerializerSync,
  createSyncHandler,
  createMockBusService,
  // createAsyncHandler,
} from "./util";

type Token = {
  clientKeyFn: () => string;
  busKeyFn: () => string;
};

const connectMap = new WeakMap<Token, TransportConnectFn<any, any, any>>();

const fakeTransportServer =
  (token: Token) =>
  (
    shinkaOn: ShinkaOn<any, any, any>,
    connect: TransportConnectFn<any, any, any>,
  ) =>
    connectMap.set(token, connect);

const serverConnectFn = (
  token: Token,
  results: Record<string, any>[],
  pipe: ReturnType<typeof mkPipe>,
) =>
  (async (thisArg, onRawData, onClosed, opts) => {
    const { 0: send_, 1: dispatch } = pipe;
    const key = token.busKeyFn();
    thisArg.bus.extra.key = key;
    const close = async () => {
      results.push({ key, opts: "closed" });
    };
    const send = (value: unknown, opts: any) => {
      results.push({ key, opts: { value, opts } });
      send_(value);
    };
    dispatch(onRawData);
    return { send, close, instruction: { hi: true, bye: true } };
  }) as TransportFactory<any, any, any>;

const serverGoConnect = (
  token: Token,
  results: Record<string, any>[],
  pipe: ReturnType<typeof mkPipe>,
) => {
  const connect = connectMap.get(token);
  if (!connect) throw new Error("No connectFn found");
  queueMicrotask(connect.bind(0, serverConnectFn(token, results, pipe)));
};

const fakeTransportClient = <SO>(
  token: Token,
  results: Record<string, any>[],
  setThisArg: (TA: InternalHandlerThisArg<any, any, any>) => void = () => {},
) =>
  ((shinkaOn) =>
    (async (thisArg, onRawData, onClosed, opts) => {
      const { 0: p1, 1: p2 } = mkPipePair(0, 0);
      setThisArg(thisArg);
      const { 0: send_, 1: dispatch } = p1;
      const key = token.clientKeyFn();
      thisArg.bus.extra.key = key;
      const close = async () => {
        results.push({ key, opts: "closed" });
      };
      const send = (value: unknown, opts: any) => {
        results.push({ key, opts: { value, opts } });
        send_(value);
      };
      dispatch(onRawData);
      serverGoConnect(token, results, p2);
      return { send, close, instruction: { hi: true, bye: true } };
    }) as TransportFactory<any, any, any>) as TransportClient<SO, any, any>;

test("pool", async () => {
  const results: Record<string, any>[] = [];
  const busSeq = sequence();
  const clientSeq = sequence();
  const token: Token = {
    busKeyFn: () => `bus-${busSeq()}`,
    clientKeyFn: () => `client-${clientSeq()}`,
  };
  const serverBus: IBus<any, any>[] = [];
  const server = new Server({
    outscope,
    transport: fakeTransportServer(token),
  });

  server.addEventListener("connect", (bus) => serverBus.push(bus));

  createSyncHandler("server-sync", server, results);

  const clientTransport = fakeTransportClient(token, results);
  const pool = new Pool({
    outscope,
    scheduler: new Asynq<any>({ items: FIFO, waiters: FIFO }),
    transport: clientTransport,
  });

  createSyncHandler("pool-sync", pool, results);

  const serverSyncService = createMockBusService("server-sync");
  const poolSyncService = createMockBusService("pool-sync");

  server.start();

  // use-case: grow the pool
  await pool.setSize(5);

  await sleep(0); // wait for server initialization

  {
    // use-case: pool -> server
    using bus = await pool.acquire();
    results.push({
      key: "pool-response",
      opts: await serverSyncService(bus, "bus-server", true, true, true),
    });
  }

  // use-case: server -> pool
  results.push({
    key: "server-response",
    opts: await poolSyncService(serverBus[0], "server-bus", true, true, true),
  });

  // use-case: shrink the pool
  await pool.setSize(0);

  await sleep(0);

  // console.dir(results, { depth: 5 });

  expect(results).toStrictEqual([
    { key: "client-0", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "client-1", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "client-2", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "client-3", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "client-4", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "bus-0", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "bus-1", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "bus-2", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "bus-3", opts: { value: [7, 0, 0], opts: undefined } },
    { key: "bus-4", opts: { value: [7, 0, 0], opts: undefined } },
    {
      key: "client-0",
      opts: {
        value: [0, 0, "server-sync", ["bus-server", true, true]],
        opts: "server-sync-req-transport",
      },
    },
    { key: "sync-request", arg: "bus-server" },
    {
      key: "bus-0",
      opts: {
        value: [1, 0, "bus1-simple-response-send"],
        opts: "sync-transport-default",
      },
    },
    { key: "pool-response", opts: "bus1-simple-response-send" },
    {
      key: "bus-0",
      opts: {
        value: [0, 0, "pool-sync", ["server-bus", true, true]],
        opts: "pool-sync-req-transport",
      },
    },
    { key: "sync-request", arg: "server-bus" },
    {
      key: "client-0",
      opts: {
        value: [1, 0, "bus1-simple-response-send"],
        opts: "sync-transport-default",
      },
    },
    { key: "server-response", opts: "bus1-simple-response-send" },
    { key: "client-1", opts: { value: [7, 0, 1], opts: undefined } },
    { key: "client-1", opts: "closed" },
    { key: "client-2", opts: { value: [7, 0, 1], opts: undefined } },
    { key: "client-2", opts: "closed" },
    { key: "client-3", opts: { value: [7, 0, 1], opts: undefined } },
    { key: "client-3", opts: "closed" },
    { key: "client-4", opts: { value: [7, 0, 1], opts: undefined } },
    { key: "client-4", opts: "closed" },
    { key: "client-0", opts: { value: [7, 0, 1], opts: undefined } },
    { key: "client-0", opts: "closed" },
    { key: "bus-1", opts: "closed" },
    { key: "bus-2", opts: "closed" },
    { key: "bus-3", opts: "closed" },
    { key: "bus-4", opts: "closed" },
    { key: "bus-0", opts: "closed" },
  ]);
});
