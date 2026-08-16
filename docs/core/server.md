# `Server`

`Server` represents the server side of a one-to-many communication relationship.

Unlike [`Client`](#), which represents a single one-to-one communication endpoint, `Server` accepts connections from multiple peers and creates a separate [`Bus`](#) for each connection.

A `Server` is typically the entry point for accepting incoming connections. Each accepted connection is represented by its own `Bus`, while request and event handlers can be registered once on the server and shared by all connections.

## Basic usage

```ts
import { Server } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/node-process";
import { websocketServer } from "...";

const server = new Server({
  outscope,
  transport: websocketServer,
});

server.onRequest("meta", async () => {
  return {
    version: "1.0.0",
  };
});

server.onDataEvent("log", (data, bus) => {
  console.log("Client:", data);
});

server.addEventListener("error", console.error);

server.start();
```

The exact transport implementation is independent of `Server`. See the [transport documentation]() for details.

## Connection model

`Server` represents a **one-to-many** relationship:

```text
                    ┌─────────────┐
                    │   Server    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
           ┌─────┐      ┌─────┐      ┌─────┐
           │ Bus │      │ Bus │      │ Bus │
           └─────┘      └─────┘      └─────┘
              │            │            │
              ▼            ▼            ▼
           Client       Client       Client
```

Every accepted connection gets its own `Bus`.

The `Bus` is the representation of the actual connection. Consequently, handlers registered on the server receive the corresponding `Bus` as their `thisArg`:

```ts
server.onRequest("user", async (data, bus) => {
  // `bus` represents the connection that sent the request.
});
```

This makes it possible to distinguish clients and communicate with a specific connection.

For example:

```ts
server.onDataEvent("message", (data, bus) => {
  bus.dataEvent("message", {
    received: data,
  });
});
```

See the [`Bus` documentation]() for details about connection-level operations.

## `Server` vs `Client`

`Client` and `Server` describe different **communication relationships**, not necessarily different runtime roles.

`Client` represents **one-to-one** communication:

```text
Client ───────── Client
```

`Server` represents **one-to-many** communication:

```text
             ┌─ Client
Server ──────┼─ Client
             └─ Client
```

The name of the transport does not determine whether an endpoint is a `Client` or a `Server`.

For example, with a `DedicatedWorker`, both sides can be represented by `Client`, because there is only one peer on each side. A `Server` is appropriate when one endpoint manages multiple independent connections.

## Constructor

```ts
new Server({
  outscope,
  transport,
  serializer,
  limon,
  responseTimeout,
  lock,
});
```

### `outscope`

```ts
outscope: OutScope
```

Defines the lifetime of the execution scope in which the server operates.

`Server` does not assume a particular runtime or lifecycle API. The supplied `OutScope` implementation determines when the surrounding execution scope ends.

See the [`@shinka-rpc/outscope` documentation]().

This option is required.

### `transport`

```ts
transport: TransportServer<SO, TO, any>
```

Server-side transport implementation.

The transport is responsible for accepting incoming connections and notifying `Server` when a new connection is available. `Server` then creates a `Bus` for that connection.

The transport is deliberately independent from the `Server` abstraction and can be implemented over different communication mechanisms.

See the [transport documentation]().

This option is required.

### `serializer`

```ts
serializer?: SerializerRoot<SO, TO, any>
```

Defines how messages are serialized and deserialized.

If omitted, the default serializer is used.

See the [serializer documentation]().

### `limon`

```ts
limon?: LiMon<SO, TO, any> | null
```

Optional liveness monitoring for individual connections.

When configured, each `Bus` created by the server gets its own LiMon instance.

See the [LiMon documentation]().

### `responseTimeout`

```ts
responseTimeout?: number
```

Maximum amount of time allowed for a request to receive its response.

The default value is used when the option is omitted.

### `lock`

```ts
lock?: ExclusiveLock<SO, TO, any>
```

Implementation of the exclusive-lock mechanism used by connections managed by the server.

The default implementation is used when omitted.

See the [exclusive lock documentation]().

## Request handlers

Use `onRequest` to handle requests sent by connected peers.

```ts
server.onRequest("meta", async () => {
  return await getMetadata();
});
```

The handler receives the request key, request data, and the `Bus` representing the connection that sent the request.

```ts
server.onRequest("user", async (data, bus) => {
  console.log("Request from:", bus);

  return await getUser(data);
});
```

Handlers are shared by all connections managed by the server.

This means that you normally register a handler once rather than registering it separately for every connection.

## Data event handlers

Use `onDataEvent` to handle one-way data events.

```ts
server.onDataEvent("message", (data, bus) => {
  console.log("Received:", data);
});
```

Unlike requests, data events do not expect a response.

The `Bus` argument identifies the connection that produced the event.

## Event listeners

`Server` exposes connection-level event listeners inherited from its internal connection manager:

```ts
server.addEventListener("connect", (bus) => {
  console.log("Connection established", bus);
});

server.addEventListener("disconnect", (bus) => {
  console.log("Connection closed", bus);
});

server.addEventListener("error", (bus, error) => {
  console.error("Connection error", error);
});
```

These events concern individual `Bus` instances managed by the server.

In addition, `Server` has its own lifecycle events described below.

## Server lifecycle

### `start()`

```ts
server.start();
```

Starts the server and begins accepting new connections.

`start()` is synchronous. It does not wait for clients to connect.

Once started, the server's transport may call the internal connection callback whenever a new peer connects. Each connection is turned into a new `Bus`.

Calling `start()` while the server is already started is an invalid operation.

### `stop()`

```ts
await server.stop();
```

Stops accepting new connections and disposes all currently active connections.

The server emits `predisconnect` before closing its connections and `postdisconnect` after all connections have been disposed.

After `stop()` completes, the server returns to the stopped state and can be started again.

### `size`

```ts
server.size
```

Returns the number of currently active connections.

```ts
console.log(server.size);
```

The value represents the number of `Bus` instances currently managed by the server.

## Server lifecycle events

`Server` has three lifecycle events:

```ts
"connect" | "predisconnect" | "postdisconnect"
```

They describe the lifecycle of the **server itself**, rather than individual connections.

### `connect`

Emitted when the server starts accepting connections.

```ts
server.addEventListener("connect", () => {
  console.log("Server started");
});
```

It does **not** mean that a client has connected.

For individual connection events, use the server's `connect`/`disconnect` events for `Bus` instances.

### `predisconnect`

Emitted when the server begins shutting down.

At this point the server has stopped accepting new connections and is about to dispose of its active connections.

```ts
server.addEventListener("predisconnect", () => {
  console.log("Server is shutting down");
});
```

### `postdisconnect`

Emitted after all active connections have been disposed.

```ts
server.addEventListener("postdisconnect", () => {
  console.log("All connections closed");
});
```

## `extra`

```ts
server.extra
```

A user-defined storage object associated with the server.

The library does not assign any semantics to this object, so applications can use it to attach arbitrary state or metadata.

```ts
server.extra.authentication = authenticationService;
```

## Advanced usage

`Server` is built on top of [`Hub`](#), which manages the collection of connection-level `Bus` instances.

Most applications should use `Server` directly. `Hub` is exposed primarily for advanced use cases where the application needs to manage connection creation independently from a specific server transport.

See the [`Hub` documentation]().
