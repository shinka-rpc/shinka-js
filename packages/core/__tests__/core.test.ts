import EventEmitter from "node:events";
import { expect, jest, test } from "@jest/globals";

import {
  ClientBus,
  Response,
  type ClientBusProps,
  type FactoryClient,
  type Serializer,
} from "@shinka-rpc/core";

const mkPipe = (eventEmitter: EventEmitter, key: string) => {
  const send = (value: any) => eventEmitter.emit(key, value);
  const dispatch = (cb: (value: any) => void) => eventEmitter.on(key, cb);
  return [send, dispatch] as [typeof send, typeof dispatch];
};

const mkPipePair = (eventEmitter: EventEmitter, key1: string, key2: string) => {
  const [send1, dispatch1] = mkPipe(eventEmitter, key1);
  const [send2, dispatch2] = mkPipe(eventEmitter, key2);
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

test("basic", async () => {
  let KEY: string;
  const results: Record<string, any>[] = [];

  const eventEmitter = new EventEmitter();
  const [pipe1to2, pipe2to1] = mkPipePair(eventEmitter, "1=>2", "2=>1");

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

  KEY = "bus1-simple";

  bus1.onRequest(
    KEY,
    (args: any) => {
      results.push({ key: "bus1-simple-request", args });
      return "bus1-simple-response-send";
    },
    {
      serialize: "bus1-simple-default",
      transport: "bus1-simple-default",
    },
  );

  results.push({
    key: "bus1-simple-response-got",
    out: await bus2.request(KEY, "bus1-simple-args", {
      serialize: "bus1-simple-req-serialize",
      transport: "bus1-simple-req-transport",
    }),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: "bus1-simple-req-serialize" },
    { key: "bus2-transport", opts: "bus1-simple-req-transport" },
    { key: "bus1-simple-request", args: "bus1-simple-args" },
    { key: "bus1-serializer", opts: "bus1-simple-default" },
    { key: "bus1-transport", opts: "bus1-simple-default" },
    { key: "bus1-simple-response-got", out: "bus1-simple-response-send" },
  ]);

  results.length = 0; // =======================================================

  KEY = "bus1-response-ret";

  bus1.onRequest(
    KEY,
    (args: any) => {
      results.push({ key: "bus1-response-ret-request", args });
      return new Response("bus1-simple-response-send", {
        serialize: "bus1-response-ret-send",
        transport: "bus1-response-ret-send",
      });
    },
    {
      serialize: "bus1-response-ret-default",
      transport: "bus1-response-ret-default",
    },
  );

  results.push({
    key: "bus1-simple-response-ret-got",
    out: await bus2.request(KEY, "bus1-response-ret-args", {
      serialize: "bus1-response-ret-serialize",
      transport: "bus1-response-ret-transport",
    }),
  });

  expect(results).toStrictEqual([
    { key: "bus2-serializer", opts: "bus1-response-ret-serialize" },
    { key: "bus2-transport", opts: "bus1-response-ret-transport" },
    { key: "bus1-response-ret-request", args: "bus1-response-ret-args" },
    { key: "bus1-serializer", opts: "bus1-response-ret-send" },
    { key: "bus1-transport", opts: "bus1-response-ret-send" },
    {
      key: "bus1-simple-response-ret-got",
      out: "bus1-simple-response-send",
    },
  ]);
});
