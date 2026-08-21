import { inflate, deflate } from "pako";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

import createHighOrderSync from "@shinka-rpc/libserializer/high-order-sync";

export const simpleGzip = createHighOrderSync({
  mode: "text",
  bin: { serialize: deflate, deserialize: inflate },
  text: {
    serialize: (data) => deflate(textEncoder.encode(data)),
    deserialize: (data) => textDecoder.decode(inflate(data)),
  },
  updateContentType: (contentType) => contentType + "gzip",
});
