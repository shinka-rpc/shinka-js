# ReusablePromise

`ReusablePromise` is a reusable Promise-like synchronization primitive.

Unlike a regular Promise, it can be reset after settlement, allowing multiple independent waiting cycles while retaining the same object reference.

It can be useful for synchronization, signaling completion, coordinating asynchronous operations, and implementing higher-level concurrency primitives.

## Basic usage

```typescript
import { ReusablePromise } from "@shinka-rpc/concurrency";

const ready = new ReusablePromise<void>();

// Wait until ready.resolve() is called.
await ready;

// Somewhere else:
ready.resolve();
```

## State and lifecycle

A `ReusablePromise` starts in a pending state.

- `resolve(value)` fulfills the current Promise.
- `reject(reason)` rejects the current Promise.
- `reset()` starts a new waiting cycle if the current cycle has settled.
- `isDone` indicates whether a resolver (`resolve` or `reject`) has been called during the current cycle.

Calling `reset()` while the current cycle is pending has no effect.

### Reusing an instance

```typescript
const signal = new ReusablePromise<number>();

console.log(signal.isDone); // false

signal.resolve(123);

console.log(signal.isDone); // true

const value1 = await signal; // 123
const value2 = await signal; // 123

signal.reset();

console.log(signal.isDone); // false

signal.resolve(456);

const value3 = await signal; // 456
```

Multiple consumers can await the same cycle independently. They all observe the same fulfillment value or rejection reason.

Each call to `reset()` after settlement creates a new underlying Promise. Previously obtained Promises and their chains remain associated with their original cycle.

## Rejection

Unlike a conventional one-shot synchronization event, `ReusablePromise` also supports rejection.

```typescript
const operation = new ReusablePromise<number>();

operation.reject(new Error("Operation failed"));

try {
  await operation;
} catch (error) {
  console.error(error);
}

console.log(operation.isDone); // true

operation.reset();

console.log(operation.isDone); // false
```

A rejected instance can be reset and reused just like a fulfilled one.

## Promise interface

`ReusablePromise` implements `PromiseLike<P>` and provides the standard Promise methods:

- `then()` registers fulfillment and rejection handlers.
- `catch()` registers a rejection handler.
- `finally()` registers a handler executed upon settlement.

These methods delegate to the underlying Promise of the current cycle and return regular Promises, allowing standard Promise composition.

```typescript
const signal = new ReusablePromise<string>();

const result = signal.then(value => value.toUpperCase());

signal.resolve("hello");

console.log(await result); // "HELLO"
```

Note that Promise chains created before `reset()` remain associated with the previous cycle. Resetting the instance does not affect already obtained Promises or their chains.

## API

| Member | Description |
|---|---|
| `constructor()` | Creates a new instance in the pending state. |
| `resolve(value: P)` | Fulfills the current cycle with a value. |
| `reject(reason?: any)` | Rejects the current cycle with a reason. |
| `reset()` | Starts a new cycle if the current one has settled. Returns the same instance. |
| `isDone: boolean` | Indicates whether `resolve()` or `reject()` has been called during the current cycle. |
| `then<TResult1, TResult2>(onfulfilled?, onrejected?)` | Registers fulfillment and rejection handlers. Returns a regular Promise. |
| `catch<TResult>(onrejected?)` | Registers a rejection handler. Returns a regular Promise. |
| `finally(onfinally?)` | Registers a settlement handler. Returns a regular Promise. |

`ReusablePromise` is particularly useful when the same synchronization point needs to be signaled repeatedly without allocating and distributing a new synchronization object for every cycle.
