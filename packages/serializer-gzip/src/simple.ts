import { inflate, deflate, type DeflateFunctionOptions } from "pako";
import createHighOrder from "@shinka-rpc/libserializer/high-order";

export const simpleGzip = createHighOrder({
  mode: "text",
  bin: {
    serialize: [
      (data, thisArg, opts?: DeflateFunctionOptions) => deflate(data, opts),
      "Function",
    ],
    deserialize: [(data, thisArg) => inflate(data), "Function"],
  },
  text: {
    serialize: [
      (data, thisArg, opts?: DeflateFunctionOptions) =>
        deflate(thisArg.state.encoder.encode(data), opts),
      "Function",
    ],
    deserialize: [
      (data, thisArg) => thisArg.state.decoder.decode(inflate(data)),
      "Function",
    ],
  },
  mimeSubType: "gzip",
  initState: () => ({
    decoder: new TextDecoder(),
    encoder: new TextEncoder(),
  }),
});
