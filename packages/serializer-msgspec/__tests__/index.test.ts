import { expect, test } from "@jest/globals";

import { createHandlerRegistries } from "../../core/src/shinka";
import serializer, { type SerializerMSGPackOpts } from "../src";

import type { SerializerInstance } from "../../core";

const data: any = [0, 1, "2345", true, { for: "test" }];

const makeSerializer = async (): Promise<
  SerializerInstance<SerializerMSGPackOpts>
> => {
  const serializerFactory = serializer(createHandlerRegistries());
  return await serializerFactory({} as any, { root: "array" });
};

test("msgpack", async () => {
  const serializerInstance = await makeSerializer();
  expect(
    serializerInstance.deserialize(serializerInstance.serialize(data)),
  ).toStrictEqual(data);
});
