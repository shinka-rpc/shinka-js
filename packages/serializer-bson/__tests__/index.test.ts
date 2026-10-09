import { expect, test } from "@jest/globals";

import { createHandlerRegistries } from "../../core/src/shinka";
import serializer from "../src";

import type { SerializerInstance } from "../../core";

const data: any = [0, 1, "2345🌍", true, { for: "test" }];

const makeSerializer = (): SerializerInstance<void> => {
  const serializerFactory = serializer(createHandlerRegistries());
  return serializerFactory({} as any, { root: "array" });
};

test("bson", async () => {
  const serializerInstance = makeSerializer();
  expect(
    serializerInstance.deserialize(serializerInstance.serialize(data)),
  ).toStrictEqual(data);
});
