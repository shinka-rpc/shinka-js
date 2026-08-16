# Pool

`Pool` is an advanced connection manager for maintaining a reusable set of one-to-one connections.

Unlike [`Hub`](), which exposes and manages individual [`Bus`]() instances, `Pool` manages a collection of connections and provides them to consumers on demand.

```text id="1k8g3c"
                    ┌──── Bus ──── Peer
                    │
Pool ───────────────┼──── Bus ──── Peer
                    │
                    └──── Bus ──── Peer
```

A connection acquired from the pool is exclusively owned by the caller until it is disposed. Once released, the connection becomes available for another consumer.

`Pool` is primarily intended for advanced use cases and as a building block for higher-level abstractions such as [`Server`](). Most applications should not need to use it directly.

## Installation

```bash
npm install @shinka-rpc/core
```

## Creating a Pool

A pool requires an `OutScope`, a transport, and a scheduler.

```ts
import { Pool } from "@shinka-rpc/core";

const pool = new Pool({
  outscope,
  transport,
  scheduler,
});
```

See [`@shinka-rpc/outscope`]() for `OutScope`.

See [Transport documentation]() for transports.

See [Serializer documentation]() for serializers.

See [LiMon documentation]() for liveness monitoring.

See [Exclusive Lock documentation]() for exclusive locking.

## Pool size

The number of connections maintained by the pool is controlled by `size`.

```ts
await pool.setSize(5);
```

This creates five connections and makes them available for acquisition.

The size can be changed dynamically:

```ts
await pool.setSize(10);
```

Connections are created when the new size is greater than the current size and stopped when it is smaller.

The current size is available through the `size` property:

```ts
console.log(pool.size);
```

The property can also be assigned directly:

```ts
await pool.setSize(5);

// Equivalent to:
// pool.size = 5;
```

However, assigning `size` returns a promise only through `setSize()`. The setter itself cannot be awaited.

For code that needs to wait until the requested size has been reached, use `setSize()`.

## Acquiring a connection

Use `acquire()` to obtain an available connection:

```ts
const bus = await pool.acquire();

await bus.request("get-data", {});
```

If all connections are currently in use, `acquire()` waits until a connection is released.

The returned object is a `BusProxy`, which exposes the same communication API as a `Bus` and additionally implements the disposal protocol.

## Releasing a connection

A connection must be released after use.

The recommended approach is JavaScript's explicit resource management:

```ts
using bus = await pool.acquire();

await bus.request("get-data", {});
```

When the scope ends, the connection is automatically returned to the pool.

The proxy can also be disposed explicitly:

```ts
const bus = await pool.acquire();

try {
  await bus.request("get-data", {});
} finally {
  bus.dispose();
}
```

After `dispose()` has been called, the proxy can no longer be used.

Its methods will throw instead of accessing the underlying connection.

## Scheduler

The pool does not define how available connections are selected.

Instead, it receives a scheduler:

```ts
type IScheduler<T> = {
  push: (value: T) => void;
  pop: () => Promise<T>;
};
```

The scheduler controls which available connection is returned by `acquire()` and how callers wait when no connection is available.

This makes the connection-selection strategy replaceable.

For example, a scheduler can implement:

* FIFO;
* LIFO;
* round-robin-like rotation;
* priority-based selection;
* custom scheduling policies.

A scheduler operates on pool entries containing the connection and its release function:

```ts
type PoolEntry<SO, TO> = [
  IBus<SO, TO>,
  () => void,
];
```

The scheduler is therefore responsible only for scheduling available connections. The pool remains responsible for creating, stopping, acquiring, and releasing them.

## Requests and data events

`Pool` exposes the same user-level request and data-event handlers as `Hub`.

```ts
pool.onRequest("get-data", async (data, bus) => {
  return await getData(data);
});
```

The `bus` argument identifies the connection that received the request.

Data events can be handled in the same way:

```ts
pool.onDataEvent("message", (data, bus) => {
  console.log("Received from:", bus);
  console.log(data);
});
```

Handlers are shared by all connections managed by the pool.

## Connection events

Connection lifecycle events are also shared across the pool:

```ts
pool.addEventListener("connect", (bus) => {
  console.log("Connected:", bus);
});

pool.addEventListener("disconnect", (bus) => {
  console.log("Disconnected:", bus);
});

pool.addEventListener("error", (error) => {
  console.error(error);
});
```

These events are delegated to the underlying [`Hub`]().

## Communication through an acquired connection

An acquired `BusProxy` provides the regular bus communication API:

```ts
using bus = await pool.acquire();

await bus.request("get-data", data);

bus.dataEvent("status", {
  state: "ready",
});

const latency = await bus.ping();
```

It can also be restarted or stopped when required:

```ts
using bus = await pool.acquire();

await bus.restart();
```

The proxy exposes:

* `request()`
* `dataEvent()`
* `start()`
* `stop()`
* `restart()`
* `ping()`
* `exclusiveLock()`
* `addEventListener()`
* `removeEventListener()`
* `extra`
* `dispose()`

The communication methods operate on the specific connection acquired by the caller.

## Bidirectional communication

A pool does not restrict communication to requests initiated by the pool.

Remote peers can send requests and data events to any connection managed by the pool, regardless of whether that connection is currently acquired.

For example:

```ts
pool.onRequest("message", async (data, bus) => {
  console.log("Received from peer:", data);

  bus.dataEvent("ack", {
    received: true,
  });
});
```

This distinction is important: **acquisition controls local ownership of a connection, not whether the connection can receive remote messages.**

## Example

```ts
import { Pool } from "@shinka-rpc/core";
import { FIFO } from "@shinka-rpc/collections";
import { Asynq } from "@shinka-rpc/concurrency";

const pool = new Pool({
  outscope,
  transport,
  scheduler: new Asynq({
    items: FIFO,
    waiters: FIFO,
  }),
});

await pool.setSize(5);

using bus = await pool.acquire();

const result = await bus.request("get-data", {
  id: 42,
});

console.log(result);
```

When the `using` block ends, the connection is returned to the pool and can be acquired by another consumer.

## Configuration

```ts
type PoolProps<SO, TO> = {
  outscope: OutScope;
  transport: TransportClient<SO, TO, any>;
  scheduler: IScheduler<[IBus<SO, TO>, () => void]>;
  serializer?: SerializerRoot<SO, TO, any>;
  limon?: LiMonRF<SO, TO, any> | null;
  lock?: ExclusiveLock<SO, TO, any>;
  responseTimeout?: number;
};
```

### `outscope`

Defines the lifetime of the execution scope in which the pool operates.

See [`@shinka-rpc/outscope`]().

### `transport`

The transport used to create each connection in the pool.

See [Transport documentation]().

### `serializer`

The serializer used by connections created by the pool.

See [Serializer documentation]().

### `scheduler`

Controls how available connections are selected and how pending `acquire()` calls are queued.

This option is required.

### `limon`

Configures the optional Liveness Monitor for connections created by the pool.

See [LiMon documentation]().

### `lock`

Configures the exclusive-lock implementation used by connections created by the pool.

See [Exclusive Lock documentation]().

### `responseTimeout`

Specifies the default request timeout for connections created by the pool.

If omitted, the package default is used.

## API

### `acquire()`

Acquires an available connection from the pool.

```ts
pool.acquire(): Promise<DisposableIBus<SO, TO>>
```

The promise remains pending until a connection becomes available.

The returned proxy must be disposed after use.

### `setSize()`

Changes the number of connections maintained by the pool.

```ts
pool.setSize(size: number): Promise<void>
```

Increasing the size creates additional connections.

Decreasing the size stops available connections until the requested size is reached.

A negative size throws an error.

### `size`

Gets or sets the configured pool size.

```ts
pool.size: number
```

Use `setSize()` when the caller needs to wait for the resize operation to complete.

### `onRequest()`

Registers a request handler shared by all connections.

```ts
pool.onRequest(key, callback, metadata?)
```

### `onDataEvent()`

Registers a data-event handler shared by all connections.

```ts
pool.onDataEvent(key, callback)
```

### `addEventListener()`

Registers a connection lifecycle event listener.

```ts
pool.addEventListener(type, listener)
```

### `removeEventListener()`

Removes a connection lifecycle event listener.

```ts
pool.removeEventListener(type, listener)
```

### `extra`

An application-defined object shared with the underlying hub.

```ts
pool.extra.someValue = value;
```

`extra` is not interpreted by `@shinka-rpc/core`.

## Pool vs. Hub

Both `Pool` and `Hub` manage multiple connections, but they solve different problems.

|                      | `Hub`                    | `Pool`               |
| -------------------- | ------------------------ | -------------------- |
| Primary purpose      | Manage connections       | Reuse connections    |
| Connection access    | Directly through `Bus`   | Through `acquire()`  |
| Connection ownership | Application-managed      | Pool-managed         |
| Scheduling           | Not required             | Required             |
| Reuse                | Manual                   | Built in             |
| Release              | `Bus.stop()` / lifecycle | `dispose()`          |
| Typical use          | Connection management    | Concurrent workloads |

A `Hub` is appropriate when the application needs to manage individual connections directly.

A `Pool` is appropriate when the application needs a bounded set of reusable connections and multiple consumers need access to them.

## Advanced usage

`Pool` is intentionally a low-level abstraction. It exposes scheduling and connection-management primitives rather than prescribing a particular pooling strategy.

Most applications should use [`Client`]() for one-to-one communication or [`Server`]() for higher-level server-side connection management.

Use `Pool` directly when the application needs explicit control over:

* pool size;
* connection acquisition;
* connection reuse;
* scheduling policy;
* connection-level ownership;
* shared request and event handlers.
