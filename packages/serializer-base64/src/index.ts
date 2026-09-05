/// <reference lib="esnext.typedarrays">

import createHighOrder from "@shinka-rpc/libserializer/high-order";

export default createHighOrder({
  mode: "text",
  bin: {
    serialize: [(data, thisArg, opts) => data.toBase64(), "Function"],
    deserialize: [(data, thisArg) => Uint8Array.fromBase64(data), "Function"],
  },
  text: {
    serialize: [(data, thisArg, opts) => btoa(data), "Function"],
    deserialize: [(data, thisArg) => atob(data), "Function"],
  },
  mimeSubType: "base64",
});
