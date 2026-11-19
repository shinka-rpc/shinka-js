import { expect, test } from "@jest/globals";

import { renderMimeType } from "../src";

test("render-mime-type", () => {
  expect(
    renderMimeType({ type: "application", subtype: "json" }),
  ).toStrictEqual("application/json");
  expect(
    renderMimeType({
      type: "text",
      subtype: "plain",
      parameters: { charset: "utf-8", name: "my document" },
    }),
  ).toStrictEqual('text/plain; charset=utf-8; name="my document"');
  expect(
    renderMimeType({ type: "application", subtype: "json", parameters: {} }),
  ).toStrictEqual("application/json");
  expect(
    renderMimeType({ type: "application", subtype: "gzip+json" }),
  ).toStrictEqual("application/gzip+json");
  expect(() => renderMimeType({ type: ";", subtype: ";" })).toThrow();
  expect(() => renderMimeType({ type: "valid", subtype: "" })).toThrow();
  expect(() => renderMimeType({ type: "", subtype: "valid" })).toThrow();
  expect(
    renderMimeType({
      type: "text",
      subtype: "plain",
      parameters: { empty: "" },
    }),
  ).toBe('text/plain; empty=""');

  expect(
    renderMimeType({
      type: "text",
      subtype: "plain",
      parameters: { quoted: 'a"b', escaped: "a\\b" },
    }),
  ).toBe('text/plain; quoted="a\\"b"; escaped="a\\\\b"');
  expect(() => renderMimeType({ type: "text", subtype: "plain;" })).toThrow();

  expect(() =>
    renderMimeType({
      type: "text",
      subtype: "plain",
      parameters: { "invalid name": "value" },
    }),
  ).toThrow();

  expect(() =>
    renderMimeType({
      type: "text",
      subtype: "plain",
      parameters: { "": "value" },
    }),
  ).toThrow();
});
