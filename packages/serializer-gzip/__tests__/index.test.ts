import { expect, test } from "@jest/globals";

import { createHandlerRegistries } from "../../core/src/shinka";
import serializerTxt from "../../serializer-json";
import serializerBin from "../../serializer-msgspec";

import { simpleGzip } from "../src";

import type { SerializerInstance, SerializerRoot } from "../../core";

const data: any = [0, 1, "2345", true, { for: "test" }];

const makeSerializer = async (parent: SerializerRoot<any, any, any>) => {
  const reg = createHandlerRegistries();
  const serializer = simpleGzip(parent);
  const serializerFactory = serializer(reg as any);
  const serializerInstance: SerializerInstance<any> = await serializerFactory(
    {} as any,
    { root: "array" },
  );
  return serializerInstance;
};

test("gzip-txt", async () => {
  const serializerInstance = await makeSerializer(serializerTxt);
  expect(
    serializerInstance.deserialize(serializerInstance.serialize(data)),
  ).toStrictEqual(data);
});

test("gzip-bin", async () => {
  const serializerInstance = await makeSerializer(serializerBin);
  expect(
    serializerInstance.deserialize(serializerInstance.serialize(data)),
  ).toStrictEqual(data);
});
