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

const seed: any = [
  0,
  [1, 2, 3],
  "45678",
  true,
  {
    for: "test",
    a: { a: { a: { a: { a: { a: { a: { a: { a: { a: { a: 1 } } } } } } } } } },
  },
];

const data: any = [];
for (let i = 0; i < 50; i++) data.push(...seed);

const makeSerializer = async (serializer: SerializerRoot<any, any, any>) => {
  const reg = createHandlerRegistries();
  const serializerFactory = serializer(reg as any);
  const serializerInstance: SerializerInstance<any> = await serializerFactory(
    { state: {}, dispatchError: console.error } as any,
    { root: "array" },
  );
  return serializerInstance;
};

const doTest = (s1: SerializerInstance<any>, s2: SerializerInstance<any>) => {
  for (let i = 0; i < 10; i++) {
    expect(s2.deserialize(s1.serialize(data))).toStrictEqual(data);
  }
  for (let i = 0; i < 10; i++) {
    expect(s1.deserialize(s2.serialize(data))).toStrictEqual(data);
  }
  for (let i = 0; i < 10; i++) {
    expect(s2.deserialize(s1.serialize(data))).toStrictEqual(data);
    expect(s1.deserialize(s2.serialize(data))).toStrictEqual(data);
  }
};

test("gzip-simple-txt", async () => {
  for (const serializerTxt of serializersTxt) {
    doTest(
      await makeSerializer(simpleGzip(serializerTxt, undefined)),
      await makeSerializer(simpleGzip(serializerTxt, undefined)),
    );
  }
});

test("gzip-simple-bin", async () => {
  for (const serializerBin of serializersBin) {
    doTest(
      await makeSerializer(simpleGzip(serializerBin, undefined)),
      await makeSerializer(simpleGzip(serializerBin, undefined)),
    );
  }
});

test("gzip-stream-txt", async () => {
  for (const serializerTxt of serializersTxt) {
    doTest(
      await makeSerializer(streamGzip(serializerTxt, {})),
      await makeSerializer(streamGzip(serializerTxt, {})),
    );
  }
});

test("gzip-stream-bin", async () => {
  for (const serializerBin of serializersBin) {
    doTest(
      await makeSerializer(streamGzip(serializerBin, {})),
      await makeSerializer(streamGzip(serializerBin, {})),
    );
  }
});
