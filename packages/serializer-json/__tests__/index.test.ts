import { expect, test } from "@jest/globals";

import { createHandlerRegistries } from "../../core/src/shinka";
import serializer, { type JSONSerializerOptions } from "../src";

import type { SerializerInstance } from "../../core";

const data: any = [0, 1, "2345", true, { for: "test" }];

const makeSerializer = async (): Promise<
  SerializerInstance<JSONSerializerOptions>
> => {
  const serializerFactory = serializer(createHandlerRegistries());
  return await serializerFactory({} as any, { root: "array" });
};

test("json", async () => {
  const serializerInstance = await makeSerializer();
  expect(
    serializerInstance.deserialize(serializerInstance.serialize(data)),
  ).toStrictEqual(data);
});
