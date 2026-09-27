# @shinka-rpc/concurrency

Symmetric RPC bus

This package implements synchronization primitives

## ReusablePromise

Initially it was typescript port of
[python's asyncio.Event](https://docs.python.org/3/library/asyncio-sync.html#asyncio.Event).
But there are some difference:

- Name. In javascript [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) is already exists
- Payload. It's possible to pass it in javascript. Why not to do it?
- Rejectable. Why not?
- Awaitable / PromiseLike as is, `.wait()` is not needed

So, it still may be used as synchronization primitive

Usage example:

```typescript
import { ReusablePromise } from "@shinka-rpc/util";

const voidRP = new ReusablePromise<void>();
await voidRP;  // waits until `signal.set()` is called

// ===

const numRP = new ReusablePromise<Number>();
console.log(numRP.isDone);  // false

// resolve branch ===

numRP.resolve(123);  // of course this would be called in different app part
console.log(numRP.isDone);  // true

const value1 = await numRP;  // value will be 123
const value2 = await numRP;  // value will be 123 again

numRP.reset();  // numSignal resets into initial empty state
console.log(numRP.isDone);  // false

// reject branch ===

numRP.reject(321);
console.log(numRP.isDone);  // true

try {
  await numRP;
} catch (e) {
  // e will be 321
}
```

# Semaphore

An asynchronous counting semaphore for limiting the number of concurrently
running tasks.

Unlike mutexes, a semaphore allows multiple holders at the same time. Each
successful `acquire()` reserves one permit and returns a `DisposeContext`
that **must** be released when the task completes.

The semaphore supports both modern ECMAScript Explicit Resource Management
(`using`) and the traditional `try...finally` pattern.

## Installation

```ts
import { Semaphore } from "@shinka-rpc/concurrency";
import { FIFO } from "@shinka-rpc/collections";
```

## Creating a semaphore

```ts
const semaphore = new Semaphore({ waiters: FIFO, capacity: 4 });
```

### Constructor options

| Property  | Type | Description |
| --------- | ---- | ----------- |
| `capacity`   | `number` | Maximum number of concurrent permits. Must be a positive integer. |
| `waiters` | `MaybeConstructor<IQueue<...>>` | Queue implementation used for waiting acquirers. Either a queue constructor or an existing queue instance may be provided. |

The queue determines the scheduling policy for waiting tasks.

For example:

* `FIFO` provides fair first-in-first-out scheduling.
* `LIFO` wakes the most recently blocked task first.
* Any custom implementation of `IQueue` may be supplied.

## Acquiring a permit

```ts
const ctx = await semaphore.acquire();

try {
  // protected work
} finally {
  ctx.dispose();
}
```

If a permit is immediately available, the returned promise resolves at once.

Otherwise, the caller is placed into the waiting queue until another permit
becomes available.

Every successful acquisition **must** eventually be released.

## Using `using`

The returned object implements the ECMAScript Disposable protocol and can
therefore be used with `using`.

```ts
using ctx = await semaphore.acquire();

// protected work
```

The permit is automatically released when leaving the scope.

Projects that do not use Explicit Resource Management can simply call
`dispose()` manually.

## API

### `acquire(): Promise<DisposeContext>`

Waits until a permit becomes available.

Returns a `DisposeContext` representing the acquired permit.

Calling `dispose()` releases the permit back to the semaphore.

Calling `dispose()` more than once throws an error.

### `rejectPending(reason?)`

Rejects all currently pending `acquire()` operations with the provided `reason`.

This method only affects callers that are currently waiting for a permit.
It does **not** invalidate the semaphore itself, revoke already acquired
permits, or prevent future calls to `acquire()`.

This is useful when the protected resource becomes permanently unavailable and
waiting callers can no longer make progress.

#### Example

```ts
const lock = new Semaphore({ waiters: FIFO, capacity: 1 });

const permit = await lock.acquire();

const waiting = lock.acquire();

lock.rejectPending(new Error("Connection closed"));

await waiting; // rejects

// Existing permits remain valid.
permit.dispose();

// The semaphore continues to operate normally.
await lock.acquire();
```

### `value: number`

Returns the current number of available permits.

Normally this value is between `0` and `capacity`.

When the semaphore capacity is reduced while more permits are currently held
than the new limit allows, `value` becomes negative until enough permits
are released.

### `capacity: number`

Gets or changes the semaphore capacity.

Increasing the capacity immediately wakes waiting tasks until the new capacity
is exhausted.

Decreasing the capacity does **not** revoke already acquired permits. Instead,
future acquisitions remain blocked until enough permits have been released.

## Dynamic resizing

The semaphore supports changing its capacity at runtime.

```ts
semaphore.capacity = 8;
```

Increasing the capacity immediately schedules waiting tasks.

```ts
semaphore.capacity = 2;
```

Shrinking the capacity is also supported.

If more permits are currently held than the new capacity allows, the semaphore
enters an overcommitted state. Existing holders continue running normally,
while new acquisitions remain blocked until the number of active permits falls
below the configured capacity.

## Queue customization

The semaphore is independent of any particular queue implementation.

Any object implementing `IQueue` can be used to control how waiting tasks are
scheduled.

This makes it possible to implement different scheduling strategies such as:

* FIFO
* LIFO
* Circular buffers (TBD)
* Priority queues (TBD)
* Custom application-specific policies

without modifying the semaphore itself.

## Notes

* `capacity` must always be a positive integer.
* Every acquired permit must eventually be released.
* Releasing the same permit more than once throws an error.
* Waiting order depends entirely on the supplied queue implementation.
* The semaphore instance itself is immutable after construction; only its
internal state changes.

## Common patterns

### Mutex (Lock)

A traditional mutex is simply a semaphore with a capacity of one.

```ts
import { FIFO } from "@shinka-rpc/collections";
import { Semaphore } from "@shinka-rpc/concurrency";

const Lock = new Semaphore({ waiters: FIFO, capacity: 1 });
```

Only one task may hold the permit at any given time. Additional callers wait
until the current holder releases it.

### Fair semaphore

A fair semaphore processes waiting tasks in the order they arrived.

```ts
import { FIFO } from "@shinka-rpc/collections";
import { Semaphore } from "@shinka-rpc/concurrency";

const semaphore = new Semaphore({ waiters: FIFO, capacity: 8 });
```

### Stack-based scheduling

Replacing the waiting queue changes the scheduling policy without changing the
semaphore itself.

```ts
import { LIFO } from "@shinka-rpc/collections";
import { Semaphore } from "@shinka-rpc/concurrency";

const semaphore = new Semaphore({ waiters: LIFO, capacity: 8 });
```

The most recently blocked task will acquire the next available permit.

# Asynq

`Asynq<T>` is an asynchronous synchronization primitive that allows producers
and consumers to exchange values through a configurable queue.

Unlike a regular queue, consumers may wait asynchronously for the next
available value. If a consumer is already waiting when a value is pushed,
the value is delivered immediately without being buffered.

The ordering of buffered values and waiting consumers is fully determined by
the supplied queue implementations from `@shinka-rpc/collections`.

## Example

```ts
import { FIFO } from "@shinka-rpc/collections";
import { Asynq } from "@shinka-rpc/concurrency";

const queue = new Asynq<number>({ items: FIFO, waiters: FIFO });

queue.pop().then(console.log);

queue.push(42);

// 42
```

## Constructor

```ts
new Asynq({ items, waiters })
```

### `items`

Queue implementation used to store buffered values.

### `waiters`

Queue implementation used to store pending consumers waiting for the next
value.

Both arguments may be either an existing queue instance or a constructor.

## Methods

### `push(value)`

Pushes a value into the queue.

If one or more consumers are already waiting, the value is delivered directly
to the next waiting consumer without entering the internal buffer.

Otherwise the value is stored in the underlying `items` queue.

### `pop()`

Returns a `Promise<T>`.

If a buffered value is available, the promise resolves immediately.

Otherwise the consumer is suspended until another call to `push()` provides a
value.

### `truncate(length = 0)`

Truncates the buffered items queue.

Pending consumers waiting in `pop()` are **not** affected.

### `map(callback)`

Maps over buffered items.

Waiting consumers are not included.

### `forEach(callback)`

Iterates over buffered items.

Waiting consumers are not included.

## Properties

### `length`

Number of buffered items currently stored in the queue.

This value does **not** include pending `pop()` operations.

## Queue semantics

`Asynq` does not impose FIFO ordering itself.

Instead, ordering is entirely determined by the queue implementations supplied
to the constructor.

| `items` | `waiters` | Behavior |
|---------|-----------|----------|
| FIFO | FIFO | Classic asynchronous queue |
| LIFO | FIFO | Asynchronous stack |
| FIFO | LIFO | Queue with LIFO waiter scheduling |
| LIFO | LIFO | Stack with LIFO waiter scheduling |

## Notes

- Inspired by Python's `asyncio.Queue`.
- Unlike `asyncio.Queue`, no maximum queue size is supported.
- `push()` is always synchronous.
- Future versions may provide asynchronous iteration via `Symbol.asyncIterator`.
