/// <reference lib="esnext.typedarrays">

import createHighOrder from "@shinka-rpc/libserializer/high-order";

export default createHighOrder({
  modeMap: { binary: "text", text: "text" },
  bin: {
    serialize: [(data, thisArg, opts) => data.toBase64(), "Function"],
    deserialize: [(data, thisArg) => Uint8Array.fromBase64(data), "Function"],
  },
  text: {
    serialize: [
      (data, { state: { encoder } }, opts) => encoder.encode(data).toBase64(),
      "Function",
    ],
    deserialize: [
      (data, { state: { decoder } }) =>
        decoder.decode(Uint8Array.fromBase64(data)),
      "Function",
    ],
  },
  initState: () => ({
    encoder: new TextEncoder(),
    decoder: new TextDecoder(),
  }),
  mimeSubType: "base64",
});
