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
