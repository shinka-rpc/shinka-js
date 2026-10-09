# @shinka-rpc/serializer-bson

A BSON serializer for [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
[Documentation is here](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/serializers/bson.html)

This package integrates BSON serialization using
[`@kai3341/bsonfy`](https://www.npmjs.com/package/@kai3341/bsonfy),
a fork of [`bsonfy`](https://www.npmjs.com/package/bsonfy).

## Usage

```typescript
import serializer from "@shinka-rpc/serializer-bson";
```

## Features

* **Binary serialization** — encodes messages as BSON binary data.
* **No additional serializer options** — uses the default behavior of the underlying BSON implementation.

## Dependencies

This package depends on [`@kai3341/bsonfy`](https://www.npmjs.com/package/@kai3341/bsonfy), a fork of [`bsonfy`](https://www.npmjs.com/package/bsonfy).

The fork replaces the original library's custom text encoder with the built-in implementation, addressing an emoji encoding issue while reducing code size and improving performance. The corresponding change has been proposed upstream but has not yet been merged.

## Use as a Starting Point

This implementation can also serve as a reference for integrating BSON or other binary serialization formats with `@shinka-rpc/core`.

If you need different encoding behavior, custom transformations, or another BSON implementation, you can copy and adapt the serializer to your requirements.

For the serializer interface and integration details, see [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
