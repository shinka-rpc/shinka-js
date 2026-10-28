# Higher-order GZIP Serializer

The package provides two implementations:

* **`simpleGzip`** — a straightforward implementation that is easy to understand and adapt.
* **`streamGzip`** — an implementation that reuses compressor and decompressor instances across messages.

Both implementations use the high-order serializer infrastructure from `@shinka-rpc/libserializer` to integrate gzip compression with Shinka RPC.

## Features

* **Gzip compression** — compresses serialized data into binary form.
* **Text and binary support** — accepts both text and binary serialization modes.
* **Reusable compression state** — `streamGzip` retains its compression and decompression instances between messages.
* **Configurable compression** — supports the relevant `pako` options.
* **Adaptable implementations** — provides both a simple example and an alternative implementation to study, benchmark, and customize.

## Implementations

### `simpleGzip`

A minimal implementation using `pako`'s `deflate` and `inflate` functions.

```ts
import { simpleGzip } from "@shinka-rpc/serializer-gzip";
```

Each serialization or deserialization operation uses the corresponding `pako` function directly.

For binary data, the input is compressed as-is. For text data, the serializer converts text to UTF-8 bytes before compression and decodes the decompressed bytes back into text afterward.

The serializer accepts `DeflateFunctionOptions` as per-operation serialization options. Decompression uses the default `inflate` behavior.

Use this implementation when you want to understand the integration with Shinka RPC or need a simple starting point for your own compression serializer.

### `streamGzip`

An alternative implementation that reuses `pako`'s `Deflate` and `Inflate` instances.

```ts
import { streamGzip } from "@shinka-rpc/serializer-gzip";
```

Instead of creating compression and decompression state through the convenience functions for every operation, this implementation initializes reusable instances and feeds each message through them.

Configuration is provided when the serializer is initialized:

```ts
import type { StreamGzipInitOpts } from "@shinka-rpc/serializer-gzip";

const opts: StreamGzipInitOpts = {
  deflate: {
    level: 6,
  },
  inflate: {},
};
```

Both `deflate` and `inflate` options are optional and correspond to the respective `pako` configuration types.

Unlike `simpleGzip`, `streamGzip` does not accept per-operation compression options. Its compression and decompression settings are established during initialization.

**Choosing an implementation:** `streamGzip` is worth benchmarking when repeated compression operations make reusable state beneficial. However, performance depends on message sizes, workload, and runtime behavior, so neither implementation should be assumed to be universally faster.

Despite using `pako`'s streaming API internally, `streamGzip` processes each message as a completed compression or decompression operation. It does not expose a continuous stream of application messages.

## Dependencies

* [`pako`](https://www.npmjs.com/package/pako) — provides gzip-compatible compression and decompression.
* [`@shinka-rpc/libserializer`](https://www.npmjs.com/package/@shinka-rpc/libserializer) — provides the `highOrderSerializer` infrastructure used to integrate compression with Shinka RPC.

## Transport Configuration

Both implementations configure the underlying serializer to use binary transport mode, regardless of whether the input is text or binary.

The resulting data is transmitted using the `application/gzip` MIME type.

For text input, the implementations use `TextEncoder` and `TextDecoder` to convert between strings and UTF-8 bytes.

## Use as a Starting Point

This package also demonstrates how to build a compression layer around an existing serialization format using `@shinka-rpc/libserializer`.

You can copy and adapt either implementation to introduce other compression algorithms, customize text encoding, or change how compression state is managed.

For the serializer interface and integration details, see [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
