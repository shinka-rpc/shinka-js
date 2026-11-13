import { expect, test } from "@jest/globals";

import { createHandlerRegistries } from "../../core/src/shinka";
import serializerJSON from "../../serializer-json";
import serializerYAML from "../../serializer-yaml";
import serializerMsgPack from "../../serializer-msgspec";
import serializerBson from "../../serializer-bson";

import { simpleGzip, streamGzip } from "../src";

import type {
  SerializerInstance,
  SerializerRoot,
  StructuredMimeType,
  TransportInitOpts,
} from "../../core";

const serializersTxt = [
  [serializerJSON, { type: "application", subtype: "gzip+json" }],
  [serializerYAML, { type: "application", subtype: "gzip+yaml" }],
] as [SerializerRoot<any, any, any>, StructuredMimeType][];
const serializersBin = [
  [serializerMsgPack, { type: "application", subtype: "gzip+vnd.msgpack" }],
  [serializerBson, { type: "application", subtype: "gzip+bson" }],
] as [SerializerRoot<any, any, any>, StructuredMimeType][];

const seed: any = [
  0,
  [1, 2, 3],
  "45678🌍",
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
    {
      state: {},
      dispatchError: console.error,
      shinka: {
        request: console.log,
        dataEvent: console.log,
      },
    } as any,
    { root: "array" },
  );
  return serializerInstance;
};

const getMime = (opts: TransportInitOpts) => {
  if (opts.mode === "not-serialized") throw new Error();
  return opts.mime!;
};

const doTest = async (
  create: () => Promise<SerializerInstance<any>>,
  mime: StructuredMimeType,
) => {
  const { 0: s1, 1: s2 } = await Promise.all([create(), create()]);
  expect(getMime(s1.transportInitOpts)).toStrictEqual(mime);

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
  for (const { 0: serializerTxt, 1: mime } of serializersTxt) {
    doTest(() => makeSerializer(simpleGzip(serializerTxt)), mime);
  }
});

test("gzip-simple-bin", async () => {
  for (const { 0: serializerBin, 1: mime } of serializersBin) {
    doTest(() => makeSerializer(simpleGzip(serializerBin)), mime);
  }
});

test("gzip-stream-txt", async () => {
  for (const { 0: serializerTxt, 1: mime } of serializersTxt) {
    doTest(() => makeSerializer(streamGzip(serializerTxt)), mime);
  }
});

test("gzip-stream-bin", async () => {
  for (const { 0: serializerBin, 1: mime } of serializersBin) {
    doTest(() => makeSerializer(streamGzip(serializerBin)), mime);
  }
});
