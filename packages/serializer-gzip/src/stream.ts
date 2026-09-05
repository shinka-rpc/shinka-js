import {
  Deflate,
  Inflate,
  type DeflateOptions,
  type InflateOptions,
} from "pako";
import createHighOrder, {
  type ThisArgType,
} from "@shinka-rpc/libserializer/high-order";

export type StreamGzipInitOpts = {
  deflate?: DeflateOptions;
  inflate?: InflateOptions;
};

const onEnd = () => {};

export const streamGzip = createHighOrder({
  mode: "text",
  bin: {
    serialize: [
      (data, { state: { deflate } }, opts?: void) => deflate(data),
      "Function",
    ],
    deserialize: [(data, { state: { inflate } }) => inflate(data), "Function"],
  },
  text: {
    serialize: [
      (data, { state: { deflate, encoder } }, opts?: void) =>
        deflate(encoder.encode(data)),
      "Function",
    ],
    deserialize: [
      (data, { state: { inflate, decoder } }) => decoder.decode(inflate(data)),
      "Function",
    ],
  },
  mimeSubType: "gzip",
  initState: (
    props: StreamGzipInitOpts = {},
    { dispatchError }: ThisArgType,
  ) => {
    const deflator = new Deflate(props.deflate),
      inflator = new Inflate(props.inflate);

    const deflateContainer: [any] = [,];
    const inflateContainer: [any] = [,];

    deflator.onData = (data: Uint8Array) => {
      deflateContainer[0] = data;
    };

    inflator.onData = (data: Uint8Array) => {
      inflateContainer[0] = data;
    };

    deflator.onEnd = onEnd;
    inflator.onEnd = onEnd;

    const deflate = (data: Uint8Array) => {
      if (!deflator.push(data, 1)) dispatchError("Deflate error");
      return deflateContainer[0];
    };

    const inflate = (data: Uint8Array) => {
      if (!inflator.push(data, 1)) dispatchError("Inflate error");
      return inflateContainer[0];
    };

    return {
      decoder: new TextDecoder(),
      encoder: new TextEncoder(),
      deflator,
      inflator,
      deflate,
      inflate,
    };
  },
});
