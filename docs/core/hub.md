# Hub

`Hub` is a low-level one-to-many connection manager in `@shinka-rpc/core`.

Unlike [`Client`](), which represents a one-to-one communication relationship, a `Hub` manages multiple independent connections. Each connection is represented by a [`Bus`]() instance.

```text
                    ┌──── Bus ──── Peer
                    │
Hub ────────────────┼──── Bus ──── Peer
                    │
                    └──── Bus ──── Peer
```

`Hub` is primarily an internal building block used by higher-level abstractions such as [`Server`]() and [`Pool`](). Most applications should use those abstractions instead of creating a `Hub` directly.

Advanced users can use `Hub` when they need direct control over how connections are created and managed.

## Installation

```bash
npm install @shinka-rpc/core
```

## Creating a Hub

A `Hub` requires an `OutScope` and can optionally be configured with a liveness monitor, exclusive lock, and request timeout.

```ts
import { Hub } from "@shinka-rpc/core";

const hub = new Hub({
  outscope,
});
```

See [`@shinka-rpc/outscope`]() for `OutScope`.

See [LiMon documentation]() for liveness monitoring.

See [Exclusive Lock documentation]() for exclusive locking.

## Connecting peers

Unlike `Client`, a `Hub` does not receive a transport and serializer in its constructor.

They are supplied for each connection through `connect()`:

```ts
const bus = await hub.connect({
  transport,
  serializer,
});
```

Each call to `connect()` creates a new [`Bus`]().

The returned `Bus` represents exactly one connection and can be used to communicate with its corresponding peer:

```ts
const bus = await hub.connect({
  transport,
  serializer,
});

await bus.request("get-data", {});
```

Multiple connections can be created from the same `Hub`:

```ts
const first = await hub.connect({
  transport: firstTransport,
  serializer,
});

const second = await hub.connect({
  transport: secondTransport,
  serializer,
});
```

The hub keeps track of all active connections.

## Shared handlers

Handlers registered on a `Hub` are shared by all connections created by that hub.

```ts
hub.onRequest("get-meta", async () => {
  return await loadMetadata();
});
```

The handler can be invoked by any connected peer.

Similarly, data-event handlers are shared:

```ts
hub.onDataEvent("message", (data, bus) => {
  console.log("Received from peer:", data);
});
```

The handler receives the `Bus` representing the connection from which the event originated.

This makes it possible to distinguish between multiple peers without registering separate handlers for every connection.

## Requests

A request handler can be registered with `onRequest()`:

```ts
hub.onRequest("get-user", async (data, bus) => {
  return await getUser(data.id);
});
```

The callback receives:

1. the request data;
2. the `Bus` associated with the connection;
3. the request context as provided by the handler API.

The `Bus` can be used to send a response-independent event or make another request to the same peer.

For example:

```ts
hub.onRequest("subscribe", async (data, bus) => {
  await subscribe(data.id);

  bus.dataEvent("subscribed", {
    id: data.id,
  });
});
```

## Data events

`Hub` can also register handlers for incoming data events:

```ts
hub.onDataEvent("message", (data, bus) => {
  console.log("Message from peer:", data);
});
```

The `Bus` argument identifies the connection that produced the event.

## Connection events

A `Hub` can observe lifecycle events from all connections it manages.

```ts
hub.addEventListener("connect", (bus) => {
  console.log("Connected:", bus);
});

hub.addEventListener("disconnect", (bus) => {
  console.log("Disconnected:", bus);
});

hub.addEventListener("error", (error) => {
  console.error(error);
});
```

Unlike `Client`, these listeners operate at the hub level and therefore apply to all connections created by the hub.

## Disposing the Hub

`dispose()` stops all currently connected `Bus` instances.

```ts
await hub.dispose();
```

Connections that are already disconnected are removed from the hub automatically.

`dispose()` is also used to synchronize connection creation with disposal. A connection attempt that overlaps with disposal waits until disposal has completed before creating its `Bus`.

After disposal completes, the hub can be used again:

```ts
await hub.dispose();

const bus = await hub.connect({
  transport,
  serializer,
});
```

## Connection count

The `size` property returns the number of currently managed connections:

```ts
console.log(hub.size);
```

## Disposal state

The `isDisposing` property indicates whether the hub is currently disposing its connections:

```ts
if (hub.isDisposing) {
  // The hub is currently shutting down its connections.
}
```

## Configuration

```ts
type HubOptions<SO, TO> = Partial<{
  responseTimeout: number;
  limon: LiMonRF<SO, TO, any> | null;
  lock: ExclusiveLock<SO, TO, any>;
}> & {
  outscope: OutScope;
};
```

### `outscope`

Defines the lifetime of the execution scope in which the hub operates.

See [`@shinka-rpc/outscope`]().

### `responseTimeout`

Specifies the default timeout for requests made through connections managed by the hub.

If omitted, the package default is used.

### `limon`

Configures the optional Liveness Monitor for connections created by the hub.

See [LiMon documentation]().

### `lock`

Configures the exclusive-lock implementation shared by connections created by the hub.

See [Exclusive Lock documentation]().

## `connect()`

Creates and starts a new connection.

```ts
hub.connect({
  transport,
  serializer,
}): Promise<Bus<SO, TO>>
```

The `transport` and `serializer` are provided for the individual connection.

The returned `Bus` is automatically registered in the hub and removed when it disconnects.

## `dispose()`

Stops all currently managed connections.

```ts
hub.dispose(): Promise<void>
```

## `addEventListener()`

Registers a listener for events produced by connections managed by the hub.

```ts
hub.addEventListener(type, listener)
```

Supported event types are:

* `connect`
* `disconnect`
* `error`

## `removeEventListener()`

Removes a previously registered event listener.

```ts
hub.removeEventListener(type, listener)
```

## `size`

Returns the number of currently managed connections.

```ts
hub.size: number
```

## `isDisposing`

Returns `true` while the hub is disposing its connections.

```ts
hub.isDisposing: boolean
```

## When to use Hub

`Hub` is useful when an application needs to manage multiple independent connections while sharing handlers and configuration between them.

Typical use cases include:

* implementing a server;
* implementing a connection pool;
* building a custom connection manager;
* integrating `@shinka-rpc/core` with a custom transport layer;
* implementing advanced connection lifecycle policies.

For normal application code, prefer [`Client`]() or higher-level abstractions such as [`Server`]() and [`Pool`]().
