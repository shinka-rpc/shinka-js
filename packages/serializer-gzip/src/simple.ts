import { inflate, deflate } from "pako";
import createHighOrder from "@shinka-rpc/libserializer/high-order";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const simpleGzip = createHighOrder({
  mode: "text",
  bin: { serialize: [deflate, "Function"], deserialize: [inflate, "Function"] },
  text: {
    serialize: [
      (data, opts) => deflate(textEncoder.encode(data), opts),
      "Function",
    ],
    deserialize: [(data) => textDecoder.decode(inflate(data)), "Function"],
  },
  mimeSubType: "gzip",
});
