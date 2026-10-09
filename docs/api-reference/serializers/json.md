# JSON Serializer

This package demonstrates how to integrate JavaScript's built-in JSON
serialization with Shinka RPC. It has no external dependencies and uses
`JSON.stringify` and `JSON.parse` for data serialization and deserialization.

## Usage

```typescript
import serializer from "@shinka-rpc/serializer-json";
```

## Features

* **Zero dependencies** — relies entirely on built-in JavaScript APIs.
* **Configurable serialization** — supports the standard `JSON.stringify`
  `replacer` and `space` options.
* **Text transport** — configures the transport to use text mode with the
  `application/json` MIME type.
* **Simple implementation** — a practical starting point for building custom
  serializers.

## Options

The serializer accepts the following options:

| Option     | Type                                          | Description                                                                               |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `replacer` | `(this: any, key: string, value: any) => any` | Transforms values during serialization, following the standard `JSON.stringify` behavior. |
| `space`    | `string \| number`                            | Controls indentation in the serialized JSON output.                                       |

Both options are optional.

## Limitations

This serializer inherits the behavior and limitations of JavaScript's built-in
JSON APIs. In particular, JSON does not preserve arbitrary JavaScript values and
object types, such as functions, symbols, and object prototypes.

Values that cannot be represented in JSON may be omitted, transformed, or cause
serialization to fail, depending on the value and its context.

## Use as a Starting Point

Shinka RPC serializers are not necessarily meant to be used as fixed,
off-the-shelf solutions. They can also serve as examples of how to integrate
different serialization formats with `@shinka-rpc/core`.

If JSON does not meet your requirements, copy this implementation and adapt it
to your needs — for example, by adding custom value transformations, using a
different encoding, or integrating another serialization library.

For the serializer interface and integration details, see
[`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).

