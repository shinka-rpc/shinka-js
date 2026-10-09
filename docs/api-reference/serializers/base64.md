# Higher-order Base64 Serializer

This package converts binary data and text into Base64-encoded text, making it useful when a transport supports text but cannot carry binary payloads directly.

## Features

* **Text-compatible encoding** — represents binary data as Base64 text.
* **Binary and text support** — handles both binary and text serialization modes.
* **Unicode support** — encodes text as UTF-8 before Base64 conversion, preserving characters such as emoji.
* **Built-in APIs** — uses JavaScript's native Base64 and text encoding APIs without an additional Base64 library.
* **High-order serializer integration** — uses [`@shinka-rpc/libserializer`](https://www.npmjs.com/package/@shinka-rpc/libserializer) to integrate the encoding layer with Shinka RPC.

## Use Cases

Base64 is useful when a transport supports text but cannot carry binary payloads directly.

For example, it can serve as an encoding layer when communicating across environments that require text-compatible messages, including browser extension messaging boundaries with serialization restrictions.

Base64 increases the size of binary data by approximately one third. It should therefore be used when text compatibility is needed rather than as a compression or size optimization technique.

## Dependencies

This package uses [`@shinka-rpc/libserializer`](https://www.npmjs.com/package/@shinka-rpc/libserializer) for high-order serializer integration.

Base64 conversion relies on built-in JavaScript APIs:

* `Uint8Array.prototype.toBase64()` and `Uint8Array.fromBase64()` for binary data.
* `TextEncoder` and `TextDecoder` for converting text to and from UTF-8 bytes.

The binary conversion APIs require a runtime that supports them, or an appropriate polyfill. The TypeScript source also references the `esnext.typedarrays` library definitions.

## Transport Configuration

The serializer configures the underlying serializer to use text mode for both binary and text input, with the `application/base64` MIME type.

Binary data is encoded directly as Base64 and decoded back into a `Uint8Array`.

Text data is first encoded as UTF-8 bytes, then converted to Base64. During deserialization, the Base64 data is decoded into bytes and converted back to text using `TextDecoder`. This supports Unicode text, including emoji.

## Use as a Starting Point

This implementation can serve as a reference for adding a text-compatible encoding layer to a serializer using `@shinka-rpc/libserializer`.

You can copy and adapt it to use a different encoding scheme or to accommodate the requirements of a specific transport.

For the serializer interface and integration details, see [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
