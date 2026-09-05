import { expect, test } from "@jest/globals";

import { createHandlerRegistries } from "../../core/src/shinka";
import serializerJSON from "../../serializer-json";
import serializerYAML from "../../serializer-yaml";
import serializerMsgPack from "../../serializer-msgspec";
import serializerBson from "../../serializer-bson";

import { simpleGzip, streamGzip, type HighOrder } from "../src";

import type { SerializerInstance, SerializerRoot } from "../../core";

const serializersTxt = [serializerJSON, serializerYAML];
const serializersBin = [serializerMsgPack, serializerBson];

const data: any = [0, 1, "2345", true, { for: "test" }];

const makeSerializer = async (
  highOrder: HighOrder,
  parent: SerializerRoot<any, any, any>,
) => {
  const reg = createHandlerRegistries();
  const serializer = highOrder(parent);
  const serializerFactory = serializer(reg as any);
  const serializerInstance: SerializerInstance<any> = await serializerFactory(
    { state: {}, dispatchError: console.error } as any,
    { root: "array" },
  );
  return serializerInstance;
};

test("gzip-simple-txt", async () => {
  for (const serializerTxt of serializersTxt) {
    const serializerInstance = await makeSerializer(simpleGzip, serializerTxt);
    expect(
      serializerInstance.deserialize(serializerInstance.serialize(data)),
    ).toStrictEqual(data);
  }
});

test("gzip-simple-bin", async () => {
  for (const serializerBin of serializersBin) {
    const serializerInstance = await makeSerializer(simpleGzip, serializerBin);
    expect(
      serializerInstance.deserialize(serializerInstance.serialize(data)),
    ).toStrictEqual(data);
  }
});

test("gzip-stream-txt", async () => {
  const testData: any = [...data, ...data, ...data, ...data, ...data, ...data];
  for (const serializerTxt of serializersTxt) {
    const serializerInstance = await makeSerializer(streamGzip, serializerTxt);
    for (let i = 0; i < 20; i++)
      expect(
        serializerInstance.deserialize(serializerInstance.serialize(testData)),
      ).toStrictEqual(testData);
  }
});

test("gzip-stream-bin", async () => {
  const testData: any = [...data, ...data, ...data, ...data, ...data, ...data];
  for (const serializerBin of serializersBin) {
    const serializerInstance = await makeSerializer(streamGzip, serializerBin);
    for (let i = 0; i < 20; i++)
      expect(
        serializerInstance.deserialize(serializerInstance.serialize(testData)),
      ).toStrictEqual(testData);
  }
});
