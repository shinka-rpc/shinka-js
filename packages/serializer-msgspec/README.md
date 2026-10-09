# @shinka-rpc/serializer-msgspec

A MessagePack serializer for [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
[Documentation is here](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/serializers/msgspec.html)

Despite the package name, this package implements **MessagePack**, not Python's `msgspec` format or library. The name `msgspec` was chosen during an earlier exploration of the Python `msgspec` library and has been retained.

## Usage

```typescript
import serializer from "@shinka-rpc/serializer-msgspec";
```

## Features

* **Binary serialization** — encodes messages as MessagePack data.
* **Compact representation** — uses a binary format designed for efficient data exchange.
* **Configurable encoding** — exposes the options supported by the underlying MessagePack encoder.
* **Minimal integration** — delegates serialization and deserialization directly to the underlying library.

## Dependency

This package uses [`@msgpack/msgpack`](https://www.npmjs.com/package/@msgpack/msgpack) for encoding and decoding MessagePack data.

## Configuration

`SerializerMSGPackOpts` is derived from the options accepted by `@msgpack/msgpack`'s `encode` function. Refer to the [library documentation](https://github.com/msgpack/msgpack-javascript) for the available encoding options.

The serializer configures the transport to use binary mode with the `application/vnd.msgpack` MIME type.

## Use as a Starting Point

This implementation can serve as a reference for integrating MessagePack or other binary serialization formats with `@shinka-rpc/core`.

If you need custom encoding behavior, extension types, or additional transformations, you can copy and adapt the implementation to your requirements.

For the serializer interface and integration details, see [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
