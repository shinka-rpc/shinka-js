import { expect, test } from "@jest/globals";
import { sleep } from "../../util";

import {
  createSyncHandler,
  createAsyncHandler,
  createDataEventHandler,
} from "./util";

import { createHandlerRegistries, completeShinka } from "../src/shinka/shinka";
import { highOrderShinka } from "../src/shinka";
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
  createDataEventHandler("event", shinkaOn0, results);

  createSyncHandler("sync", shinkaOn1, results);
  createAsyncHandler("async", shinkaOn1, results);
  createDataEventHandler("event", shinkaOn1, results);

  shinkaOn0.onDataEvent("my-event", (value, thisArg) => {
    results.push(["my-event@0", value, thisArg.id]);
  });

  shinkaOn1.onDataEvent("my-event", (value, thisArg) => {
    results.push(["my-event@1", value, thisArg.id]);
  });

  const [setVars, shinka] = completeShinka(
    [0, 1, 2, 3],
    dispatchMap,
    5000,
    handlerRegistries,
  );

  const onMessageRequest = dispatchMap.get(0)!;
  const onSuccess = dispatchMap.get(1)!;
  const onDataEvent = dispatchMap.get(3)!;

  const thisArg = { dispatchError: push };

  associateThisArg0(thisArg, { ...thisArg, id: 0 });
  associateThisArg1(thisArg, { ...thisArg, id: 1 });

  setVars({ send: push, dispatchError: push, thisArg });

  const ho0 = completeShinka0(shinka);
  const ho1 = completeShinka1(shinka);

  expect(shinkaOn0.onDataEvent).toStrictEqual(ho0.onDataEvent);
  expect(shinkaOn0.onRequest).toStrictEqual(ho0.onRequest);

  ho0.dataEvent("event", [true, true, true]);
  const reqPromise = ho0.request("request", [true, true, true]);

  await sleep(0);

  const msgResponse: MessageResponse<any> = [1, 0, [0, "response"]];

  // @ts-ignore
  onSuccess(msgResponse);
  await reqPromise;

  const msgRequestSync1: MessageRequest<any> = [
    0,
    0,
    0,
    ["sync", [1, true, true]],
  ];

  // @ts-ignore
  onMessageRequest(msgRequestSync1);

  const msgRequestAsync1: MessageRequest<any> = [
    0,
    0,
    0,
    ["async", [2, true, true]],
  ];

  // @ts-ignore
  onMessageRequest(msgRequestAsync1);

  await sleep(0);

  const msgRequestSync2: MessageRequest<any> = [
    0,
    0,
    0,
    ["sync", [3, false, true]],
  ];

  // @ts-ignore
  onMessageRequest(msgRequestSync2);

  const msgRequestAsync2: MessageRequest<any> = [
    0,
    0,
    0,
    ["async", [4, false, true]],
  ];

  // @ts-ignore
  onMessageRequest(msgRequestAsync2);

  await sleep(0);

  const msgRequestSync3: MessageRequest<any> = [
    0,
    0,
    0,
    ["sync", [5, false, false]],
  ];

  // @ts-ignore
  onMessageRequest(msgRequestSync3);

  const msgRequestAsync3: MessageRequest<any> = [
    0,
    0,
    0,
    ["async", [6, false, false]],
  ];

  // @ts-ignore
  onMessageRequest(msgRequestAsync3);

  await sleep(0);

  const msgRequestSync4: MessageRequest<any> = [
    0,
    0,
    0,
    ["wrong-sync", [7, false, false]],
  ];

  // @ts-ignore
  onMessageRequest(msgRequestSync4);

  const msgEvent1: MessageDataEvent<any> = [3, ["event", "data"], 0];

  // @ts-ignore
  onDataEvent(msgEvent1);

  const msgEvent2: MessageDataEvent<any> = [3, ["wrong-event", "data"], 0];

  // @ts-ignore
  onDataEvent(msgEvent2);

  const msgEvent3: MessageDataEvent<any> = [3, ["event", "data"], 1];

  // @ts-ignore
  onDataEvent(msgEvent3);

  for (let i = 0; i < 2; i++) {
    const msgEvent: MessageDataEvent<any> = [3, ["my-event", "data"], i];

    // @ts-ignore
    onDataEvent(msgEvent);
  }

  expect(results).toStrictEqual([
    [3, ["event", [true, true, true]], 0],
    undefined,
    [0, 0, 0, ["request", [true, true, true]]],
    undefined,
    { key: "sync-request", arg: 1 },
    { key: "async-request", arg: 2 },
    [1, 0, "bus1-simple-response-send"],
    {},
    [1, 0, "simple-response-send"],
    {},
    { key: "sync-request", arg: 3 },
    { key: "async-request", arg: 4 },
    [1, 0, "nested-response-send"],
    { transport: "sync-transport", serialize: "sync-serialize" },
    [1, 0, "nested-response-send"],
    { transport: "async-transport", serialize: "async-serialize" },
    { key: "sync-request", arg: 5 },
    { key: "async-request", arg: 6 },
    [2, 0, "nested-response-send"],
    { transport: "sync-transport", serialize: "sync-serialize" },
    [2, 0, "nested-response-send"],
    { transport: "async-transport", serialize: "async-serialize" },
    "Unable to find handler wrong-sync",
    { key: "data-event", arg: "data" },
    "Unable to find handler wrong-event",
    { key: "data-event", arg: "data" },
    ["my-event@0", "data", 0],
    ["my-event@1", "data", 1],
  ]);
});
