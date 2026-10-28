import { expect, test } from "@jest/globals";
import { sleep } from "../../util";

import {
  createSyncHandler,
  createAsyncHandler,
  createSyncDataEventHandler,
  createAsyncDataEventHandler,
} from "./util";

import { createHandlerRegistries, completeShinka } from "../src/shinka/shinka";
import { highOrderShinka } from "../src"; // have to be from root
import type {
  ShinkaOn,
  DispatchMap,
  MessageResponse,
  MessageRequest,
  MessageDataEvent,
} from "../src";

test("high-order-shinka", async () => {
  const results: any[] = [];
  const push = results.push.bind(results);

  const dispatchMap: DispatchMap = new Map();

  const handlerRegistries = createHandlerRegistries<any, any, any>();
  const shinkaOn: ShinkaOn<any, any, any> = {
    onDataEvent: handlerRegistries.onDataEvent,
    onRequest: handlerRegistries.onRequest,
  };

  const HOSh = highOrderShinka(shinkaOn);

  const { 0: shinkaOn0, 1: associateThisArg0, 2: completeShinka0 } = HOSh(0, 0);
  const { 0: shinkaOn1, 1: associateThisArg1, 2: completeShinka1 } = HOSh(1, 1);

  createSyncHandler("sync", shinkaOn0, results);
  createAsyncHandler("async", shinkaOn0, results);
  createSyncDataEventHandler("event", shinkaOn0, results);

  createSyncHandler("sync", shinkaOn1, results);
  createAsyncHandler("async", shinkaOn1, results);
  createSyncHandler("sync-no-meta", shinkaOn1, results, false);
  createAsyncHandler("async-no-meta", shinkaOn1, results, false);

  createSyncDataEventHandler("event", shinkaOn1, results);
  createAsyncDataEventHandler("event-async", shinkaOn1, results);

  shinkaOn0.onDataEvent("my-event", (value, thisArg) => {
    push(["my-event@0", value, thisArg.id]);
  });

  shinkaOn1.onDataEvent("my-event", (value, thisArg) => {
    push(["my-event@1", value, thisArg.id]);
  });

  const {
    0: onAbort,
    1: setVars,
    2: shinka,
  } = completeShinka([0, 1, 2, 3], dispatchMap, 5000, handlerRegistries);

  const onMessageRequest = dispatchMap.get(0)!;
  const onSuccess = dispatchMap.get(1)!;
  const onDataEvent = dispatchMap.get(3)!;

  const dispatchError = (e: any) => {
    push(["dispatchError", e]);
  };
  const send = (o: any) => {
    push(["send", o]);
  };

  const thisArg = { dispatchError };

  associateThisArg0(thisArg, { ...thisArg, id: 0 });
  associateThisArg1(thisArg, { ...thisArg, id: 1 });

  setVars({ send, dispatchError, thisArg });

  const ho0 = completeShinka0(shinka);
  const ho1 = completeShinka1(shinka);

  expect(shinkaOn0.onDataEvent).toStrictEqual(ho0.onDataEvent);
  expect(shinkaOn0.onRequest).toStrictEqual(ho0.onRequest);

  ho0.dataEvent("event", [true, true, true]);
  const reqPromise = ho0.request("request", [true, true, true]);

  await sleep(0);

  // @ts-ignore
  onSuccess([1, 0, [0, "response"]] as MessageResponse<any>);
  await reqPromise;

  await sleep(0);

  // @ts-ignore
  onMessageRequest([0, 0, 0, ["sync", [1, true, true]]] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["async", [2, true, true]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["sync", [3, false, true]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["async", [4, false, true]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["sync", [5, false, false]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["async", [6, false, false]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["sync", [7, true, false]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["async", [8, true, false]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onMessageRequest([
    0,
    0,
    0,
    ["wrong-sync", [7, false, false]],
  ] as MessageRequest<any>);

  await sleep(0);

  // @ts-ignore
  onDataEvent([3, ["event", ["data", true]], 0] as MessageDataEvent<any>);

  await sleep(0);

  // @ts-ignore
  onDataEvent([3, ["wrong-event", "data"], 0] as MessageDataEvent<any>);

  await sleep(0);

  // @ts-ignore
  onDataEvent([3, ["event", ["data", true]], 1] as MessageDataEvent<any>);

  await sleep(0);

  // @ts-ignore
  onDataEvent([
    3,
    ["event", ["error+sync", false]],
    1,
  ] as MessageDataEvent<any>);

  await sleep(0);

  // @ts-ignore
  onDataEvent([
    3,
    ["event-async", ["error+async", false]],
    1,
  ] as MessageDataEvent<any>);

  await sleep(0);

  for (let i = 0; i < 2; i++) {
    // @ts-ignore
    onDataEvent([3, ["my-event", "data"], i] as MessageDataEvent<any>);
    await sleep(0);
  }

  expect(results).toStrictEqual([
    ["send", [3, ["event", [true, true, true]], 0]],
    ["send", [0, 0, 0, ["request", [true, true, true]]]],
    { key: "sync-request", arg: 1 },
    ["send", [1, 0, "bus1-simple-response-send"]],
    { key: "async-request", arg: 2 },
    ["send", [1, 0, "simple-response-send"]],
    { key: "sync-request", arg: 3 },
    ["send", [1, 0, "nested-response-send"]],
    // { serialize: "sync-serialize", transport: "sync-transport" },
    { key: "async-request", arg: 4 },
    ["send", [1, 0, "nested-response-send"]],
    // { serialize: "async-serialize", transport: "async-transport" },
    { key: "sync-request", arg: 5 },
    ["send", [2, 0, "nested-response-send"]],
    // { serialize: "sync-serialize", transport: "sync-transport" },
    { key: "async-request", arg: 6 },
    ["send", [2, 0, "nested-response-send"]],
    // { serialize: "async-serialize", transport: "async-transport" },
    { key: "sync-request", arg: 7 },
    ["send", [2, 0, "bus1-simple-response-send"]],
    { key: "async-request", arg: 8 },
    ["send", [2, 0, "simple-response-send"]],
    ["dispatchError", "Unable to find handler wrong-sync"],
    ["send", [2, 0, { error: "Unable to find handler", id: "wrong-sync" }]],
    { key: "data-event", arg: "data" },
    ["dispatchError", "Unable to find handler wrong-event"],
    { key: "data-event", arg: "data" },
    { arg: "error+sync", key: "data-event" },
    ["dispatchError", "error+sync"],
    { arg: "error+async", key: "data-event" },
    ["dispatchError", "error+async"],
    ["my-event@0", "data", 0],
    ["my-event@1", "data", 1],
  ]);
});
