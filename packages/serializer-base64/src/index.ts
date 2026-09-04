/// <reference lib="esnext.typedarrays">

import createHighOrder from "@shinka-rpc/libserializer/high-order";

export default createHighOrder({
  mode: "text",
  bin: {
    serialize: [(data) => data.toBase64(), "Function"],
    deserialize: [Uint8Array.fromBase64, "Function"],
  },
  text: { serialize: [btoa, "Function"], deserialize: [atob, "Function"] },
  mimeSubType: "base64",
});
