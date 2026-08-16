# `Bus`

`Bus` represents a single communication connection.

It is the connection-level primitive of `@shinka-rpc/core`. Higher-level abstractions such as [`Client`](), [`Server`](), [`Pool`]() and [`Hub`]() use `Bus` to represent and manage their individual connections.

A `Bus` does not define the role of either endpoint. It only represents the communication channel between two peers.

For example, both sides of a `DedicatedWorker` connection can be represented by `Bus` instances created through `Client`, even though one side happens to run inside a worker.

## Connection model

A `Bus` always represents exactly **one connection**:

```text
┌──────────────┐                  ┌──────────────┐
│    Bus A     │◄────────────────►│    Bus B     │
└──────────────┘                  └──────────────┘
```

The objects on both sides are peers. `Bus` does not distinguish between a "client" and a "server".

Higher-level abstractions determine how connections are organized:

```text
Client                     one-to-one
Server                     one-to-many
Hub                        one-to-many connection manager
Pool                       reusable collection of connections
```

See the respective documentation for [`Client`](), [`Server`](), [`Hub`]() and [`Pool`]().

## Creating a `Bus`

Most applications do not need to construct `Bus` directly.

A `Client` creates its own `Bus` internally:

```ts
const client = new Client({
  outscope,
  transport,
  serializer,
});
```

A `Server` and `Hub` create a `Bus` for every accepted connection.

A `Pool` manages multiple `Bus` instances and exposes them through disposable proxies.

Direct construction is primarily useful when building higher-level abstractions on top of `@shinka-rpc/core`.

## Sending requests

Use `request()` to send a request to the remote peer.

```ts
const metadata = await bus.request("meta", null);
```

A request has:

* a `key` identifying the requested operation;
* arbitrary request data;
* an optional metadata object.

The remote peer handles the request using `onRequest()`:

```ts
bus.onRequest("meta", async () => {
  return await getMetadata();
});
```

The returned value becomes the response of `request()`.

### Request example

The requesting side:

```ts
const user = await bus.request("user", {
  id: 42,
});
```

The receiving side:

```ts
bus.onRequest("user", async (data) => {
  return await getUser(data.id);
});
```

Requests are asynchronous and return a `Promise`.

The request response is subject to the configured response timeout. See the [`responseTimeout` documentation]().

## Handling requests

Use `onRequest()` to register a request handler.

```ts
bus.onRequest("user", async (data) => {
  return await getUser(data.id);
});
```

The handler receives the request key, request data, and the `Bus` itself as `thisArg`:

```ts
bus.onRequest("user", async (data, bus) => {
  console.log("Request received through", bus);

  return await getUser(data.id);
});
```

The `thisArg` is particularly useful when the same handler registry is shared by multiple connections.

For example, `Server` registers handlers once and passes the corresponding `Bus` to each handler.

## Sending data events

Use `dataEvent()` to send a one-way event to the remote peer.

```ts
bus.dataEvent("message", {
  text: "Hello",
});
```

A data event does not produce a response.

The remote side can subscribe with `onDataEvent()`:

```ts
bus.onDataEvent("message", (data, bus) => {
  console.log(data.text);
});
```

Data events are useful for notifications, state updates, and other messages where request/response semantics are unnecessary.

## Handling data events

Register a handler with `onDataEvent()`:

```ts
bus.onDataEvent("message", (data) => {
  console.log("Received:", data);
});
```

The handler receives:

1. the event key;
2. the event data;
3. the `Bus` that received the event.

```ts
bus.onDataEvent("message", (data, bus) => {
  console.log(data, bus);
});
```

## Starting a connection

```ts
await bus.start();
```

Starts the connection.

The exact meaning of establishing a connection is determined by the configured transport. See the [transport documentation]().

Once the bus is started, its request and event APIs can be used.

The `connect` event is emitted after the bus has successfully completed its startup sequence.

Calling `start()` on an already started bus has no effect.

## Stopping a connection

```ts
await bus.stop();
```

Stops the connection and releases its resources.

If the connection is currently active, the `disconnect` event is emitted after cleanup has completed.

Stopping a bus also stops its serializer and liveness monitor, if configured.

Calling `stop()` on an already stopped bus has no effect.

## Restarting a connection

```ts
await bus.restart();
```

Equivalent to stopping the current connection and starting it again.

```ts
await bus.restart();
```

The bus can therefore be reused after it has been stopped.

## Ping

```ts
const latency = await bus.ping();
```

Sends a ping request to the remote peer and returns the elapsed time in milliseconds.

```ts
const latency = await bus.ping();

console.log(`Round-trip time: ${latency} ms`);
```

The returned value measures the request/response round trip rather than the underlying transport latency alone.

## Events

`Bus` supports three event types:

```ts
"connect" | "disconnect" | "error"
```

Register a listener with `addEventListener()`:

```ts
bus.addEventListener("connect", () => {
  console.log("Connected");
});

bus.addEventListener("disconnect", () => {
  console.log("Disconnected");
});

bus.addEventListener("error", (error) => {
  console.error(error);
});
```

Remove a listener with `removeEventListener()`:

```ts
const onDisconnect = () => {
  console.log("Disconnected");
};

bus.addEventListener("disconnect", onDisconnect);
bus.removeEventListener("disconnect", onDisconnect);
```

### `connect`

Emitted when the bus has successfully started.

### `disconnect`

Emitted after the bus has been stopped and its resources have been cleaned up.

A disconnect may be caused by:

* an explicit call to `stop()`;
* the underlying transport closing;
* a liveness timeout;
* another fatal connection condition.

### `error`

Emitted when an error occurs while operating the bus.

```ts
bus.addEventListener("error", console.error);
```

Errors are reported through the event system rather than being silently ignored.

## Exclusive lock

`Bus` provides `exclusiveLock()` for operations that require exclusive access to the communication channel.

```ts
const lock = await bus.exclusiveLock(1000);

try {
  // exclusive operation
} finally {
  lock[Symbol.dispose]();
}
```

The lock guarantees the required channel-level exclusivity between cooperating components.

This mechanism is primarily intended for internal components and advanced integrations, for example when changing communication-related state that must not race with other messages.

See the [exclusive lock documentation]().

## `extra`

```ts
bus.extra
```

An application-defined storage object associated with the connection.

`@shinka-rpc/core` does not assign any semantics to its contents.

```ts
bus.extra.session = session;
bus.extra.authenticated = true;
```

When a `Bus` is obtained from a `Server` or `Hub`, this object belongs to that particular connection.

## Lifecycle

A typical `Bus` lifecycle is:

```text
STOPPED
   │
   │ start()
   ▼
STARTED
   │
   │ stop()
   ▼
STOPPED
```

`restart()` performs the complete transition:

```text
STARTED
   │
   │ restart()
   ▼
STOPPED
   │
   ▼
STARTED
```

The bus cannot be started while it is already starting or stopping, and invalid lifecycle operations are reported through the `error` event.

## `Bus` as a low-level API

`Bus` is intentionally small.

It does not manage:

* multiple connections;
* connection pools;
* client/server roles;
* application-level routing;
* authentication;
* application-specific state.

Those concerns belong to higher-level abstractions or to the application itself.

The core communication API is:

```ts
bus.request(key, data);
bus.dataEvent(key, data);

bus.onRequest(key, handler);
bus.onDataEvent(key, handler);
```

Connection lifecycle is managed through:

```ts
await bus.start();
await bus.stop();
await bus.restart();
```

And connection diagnostics through:

```ts
await bus.ping();
```

This makes `Bus` suitable as the common building block for both simple one-to-one connections and more complex connection managers.
