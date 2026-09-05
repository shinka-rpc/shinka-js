import { expect, test } from "@jest/globals";

import { createHandlerRegistries } from "../../core/src/shinka";
import serializerTxt from "../../serializer-json";
import serializerBin from "../../serializer-msgspec";

import base64Serializer from "../src";

import type { SerializerInstance, SerializerRoot } from "../../core";

const data: any = [0, 1, "2345", true, { for: "test" }];

const makeSerializer = async (parent: SerializerRoot<any, any, any>) => {
  const reg = createHandlerRegistries();
  const serializer = base64Serializer(parent);
  const serializerFactory = serializer(reg as any);
  const serializerInstance: SerializerInstance<any> = await serializerFactory(
    { state: {} } as any,
    { root: "array" },
  );
  return serializerInstance;
};

test("base64-txt", async () => {
  const serializerInstance = await makeSerializer(serializerTxt);
  expect(
    serializerInstance.deserialize(serializerInstance.serialize(data)),
  ).toStrictEqual(data);
});

test("base64-bin", async () => {
  const serializerInstance = await makeSerializer(serializerBin);
  expect(
    serializerInstance.deserialize(serializerInstance.serialize(data)),
  ).toStrictEqual(data);
});
