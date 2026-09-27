# @shinka-rpc/libserializer

High-order serializer utilities for [Shinka RPC](https://shinka-rpc-js.readthedocs.io/latest/).

`@shinka-rpc/libserializer` provides reusable building blocks for implementing serializers that operate **on top of another serializer**.

The package currently exports `highOrderSerializer`, which is used by serializers such as gzip and base64.

## Installation

```bash
npm install @shinka-rpc/libserializer
```

## High-order serializers

A high-order serializer does not replace the underlying serializer. Instead, it wraps it and transforms its input or output.

This makes it possible to compose serialization layers:

```text
data
  │
  ▼
high-order serializer
  │
  ▼
nested serializer
  │
  ▼
transport data
```

For example, a gzip serializer can compress the output produced by another serializer:

```text
application data
      │
      ▼
    JSON
      │
      ▼
    gzip
      │
      ▼
 Uint8Array
```

The nested serializer remains responsible for the actual serialization of application data, while the high-order serializer transforms its result.

## `highOrderSerializer`

```ts
import highOrderSerializer from "@shinka-rpc/libserializer/high-order";
```

`highOrderSerializer` creates a serializer layer from a pair of serialization implementations.

A high-order serializer can provide separate implementations for:

* text serialization;
* binary serialization;
* synchronous or asynchronous operations;
* serialization and deserialization.

It can also:

* change the transport mode;
* change the MIME type;
* maintain per-instance state;
* register its own `Shinka` handlers;
* clean up its state when the serializer instance stops.

### Basic structure

```ts
const gzip = highOrderSerializer({
  modeMap: {
    text: "binary",
    binary: "binary",
  },

  mimeSubType: "gzip",

  text: {
    serialize: [
      (data, thisArg) => {
        // transform serialized text
      },
      "Function",
    ],

    deserialize: [
      (data, thisArg) => {
        // reverse the transformation
      },
      "Function",
    ],
  },

  bin: {
    serialize: [
      (data, thisArg) => {
        // transform serialized binary data
      },
      "Function",
    ],

    deserialize: [
      (data, thisArg) => {
        // reverse the transformation
      },
      "Function",
    ],
  },
});
```

The resulting serializer is then composed with another serializer.

## Composition

A high-order serializer receives a nested serializer and wraps its serialization functions.

For example:

```text
High-order serializer A
        │
        ▼
High-order serializer B
        │
        ▼
JSON serializer
        │
        ▼
transport
```

Each layer receives its own logical `Shinka` channel and runtime context.

This allows independently developed serializer layers to communicate with their own handlers without interfering with the handlers of other layers.

## Runtime state

High-order serializers can keep state associated with a particular serializer instance.

The state is initialized when the serializer instance is created and cleared when it stops.

```ts
const serializer = highOrderSerializer({
  // ...

  initState: (props, thisArg) => {
    return {
      encoder: new TextEncoder(),
      decoder: new TextDecoder(),
    };
  },
});
```

The returned object becomes available through `thisArg.state`:

```ts
serialize: [
  (data, { state }) => {
    return state.encoder.encode(data);
  },
  "Function",
],
```

State belongs to the **runtime serializer instance**, not to the serializer definition itself.

This is important when the same serializer factory is used to create multiple independent `Bus` instances or when a `Bus` is stopped and started again.

### State initialization

`initState` has two purposes:

1. create runtime resources required by the serializer;
2. provide TypeScript with the shape of the serializer's state.

Its return value is merged into the existing `state` object.

It may also initialize the state object directly:

```ts
initState: (props, { state }) => {
  state.encoder = new TextEncoder();
};
```

Or return the state fields:

```ts
initState: () => ({
  encoder: new TextEncoder(),
});
```

The latter form allows the state type to be inferred from the return value.

## `thisArg`

Serialization callbacks receive the runtime `thisArg` associated with their high-order serializer layer:

```ts
serialize: [
  (data, thisArg) => {
    const { state, dispatchError } = thisArg;

    // ...
  },
  "Function",
],
```

Besides `state`, the context provides the runtime facilities available to the underlying Shinka RPC implementation.

The `thisArg` is specific to the serializer layer and to the current runtime instance.

When high-order serializers are nested, each layer receives its own context:

```text
parent thisArg
   │
   ├── high-order A thisArg
   │
   └── nested serializer thisArg
```

This prevents state and Shinka handlers belonging to different layers from being accidentally shared.

## Shinka integration

A high-order serializer may subscribe to its own `Shinka` handlers:

```ts
const serializer = highOrderSerializer({
  // ...

  subscribe: (shinkaOn) => {
    shinkaOn.onRequest("example", (data, thisArg) => {
      // handle request
    });
  },
});
```

The handlers registered by a high-order serializer are isolated from the handlers of the serializer it wraps.

This makes it possible for a serializer to implement protocol-level operations without exposing those operations through the application's ordinary RPC namespace.

For example, a compression layer can maintain its own state or exchange control messages without requiring the nested serializer to know how the compression layer works.

## Cleanup

A high-order serializer can provide a `stop` callback:

```ts
const serializer = highOrderSerializer({
  // ...

  stop: (thisArg) => {
    // release resources
  },
});
```

The callback receives the high-order serializer's own `thisArg`.

It is called when the corresponding serializer instance is stopped.

This is useful for releasing resources such as:

* compression streams;
* encoders and decoders;
* timers;
* buffers;
* other objects associated with the serializer instance.

## Transport mode and MIME type

A high-order serializer can change the transport mode used by the resulting serializer.

```ts
modeMap: {
  text: "binary",
  binary: "binary",
},
```

The keys describe the mode accepted by the nested serializer, while the values describe the mode exposed by the resulting serializer.

For example, a text serializer can be wrapped by gzip and exposed as binary data.

The high-order serializer can also add its MIME subtype:

```ts
mimeSubType: "gzip",
```

The resulting MIME type is composed with the MIME type provided by the nested serializer.

## Serialization callbacks

Each serialization implementation is specified together with a constructor-name hint:

```ts
serialize: [
  (data, thisArg) => {
    // ...
  },
  "Function",
],
```

The hint allows the high-order serializer to select the appropriate implementation based on the nested serializer's serialization function.

Both synchronous and asynchronous callbacks are supported.

For example:

```ts
serialize: [
  async (data, thisArg) => {
    return await transform(data);
  },
  "AsyncFunction",
],
```

The same mechanism applies to deserialization.

## Example: a stateful binary transform

A high-order serializer can combine runtime state with a nested serializer:

```ts
const transform = highOrderSerializer({
  modeMap: {
    text: "binary",
    binary: "binary",
  },

  mimeSubType: "example",

  bin: {
    serialize: [
      (data, { state }) => {
        return state.encode(data);
      },
      "Function",
    ],

    deserialize: [
      (data, { state }) => {
        return state.decode(data);
      },
      "Function",
    ],
  },

  initState: () => ({
    encode: (data: Uint8Array) => data,
    decode: (data: Uint8Array) => data,
  }),
});
```

The transform can then be composed with an ordinary serializer without that serializer having to know anything about the transform.

## Design

`highOrderSerializer` separates three responsibilities:

### Nested serializer

The nested serializer is responsible for converting application data into a transport representation.

### High-order serializer

The high-order serializer transforms that representation.

Examples include:

* compression;
* encoding;
* encryption;
* framing;
* other transport-level transformations.

### Shinka RPC

`Shinka` provides the communication channel used by serializer layers for their own requests and events.

Each high-order layer receives an isolated logical channel and runtime context, so multiple layers can be composed without sharing their internal handlers or state.

## Related packages

`@shinka-rpc/libserializer` is part of the Shinka RPC ecosystem and is intended to be used together with `@shinka-rpc/core` and serializer implementations built on top of it.

The package currently provides the infrastructure used by high-order serializers such as:

* [gzip](https://www.npmjs.com/package/%40shinka-rpc%2Fserializer-gzip);
* [base64](https://www.npmjs.com/package/%40shinka-rpc%2Fserializer-base64).

More high-order serializer utilities may be added as the library evolves.
