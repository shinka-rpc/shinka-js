# `@shinka-rpc/collections`

Symmetric RPC bus

Lightweight, linked-list based collections for predictable mutation performance.

`@shinka-rpc/collections` provides a small set of fundamental data structures
used throughout the Shinka RPC ecosystem. While primarily developed to support
packages such as `@shinka-rpc/core` and `@shinka-rpc/concurrency`, the library
is completely standalone and can be used in any TypeScript or JavaScript
project.

## Why?

JavaScript arrays are highly optimized for general-purpose workloads, but
applications that perform intensive insertion and removal operations may still
experience allocation overhead and element relocation costs.

This package implements its collections on top of linked lists instead of
`Array`, providing stable **O(1)** insertion and removal for queue- and
stack-oriented workloads.

The goal of this package is not to replace `Array`, but to provide specialized
collections where predictable mutation performance matters.

## Features

- Linked-list based implementation
- Constant-time `push()`
- Constant-time `pop()`
- Constant-time `length`
- Native iterable (`for...of`, `Array.from()`, spread syntax)
- Functional helpers (`map()`, `forEach()`)
- Zero runtime dependencies
- Fully typed

## Installation

```bash
npm install @shinka-rpc/collections
```

## Available collections

### `FIFO<T>`

A classic First-In, First-Out queue.

```ts
import { FIFO } from "@shinka-rpc/collections";

const queue = new FIFO<number>();

queue.push(1);
queue.push(2);
queue.push(3);

queue.pop(); // 1
queue.pop(); // 2
queue.pop(); // 3
```

Iteration preserves insertion order.

```ts
for (const value of queue) {
    console.log(value);
}
```

---

### `LIFO<T>`

A classic Last-In, First-Out stack.

```ts
import { LIFO } from "@shinka-rpc/collections";

const stack = new LIFO<number>();

stack.push(1);
stack.push(2);
stack.push(3);

stack.pop(); // 3
stack.pop(); // 2
stack.pop(); // 1
```

Iteration follows stack order (top to bottom).

```ts
for (const value of stack) {
    console.log(value);
}
```

## Common API

Both collections implement the same interface.

```ts
interface IQueue<T> {
    push(value: T): void;
    pop(): T | undefined;

    truncate(length?: number): void;

    map<M>(callback: (value: T, collection: IQueue<T>) => M): M[];
    forEach(callback: (value: T, collection: IQueue<T>) => void): void;

    readonly length: number;

    [Symbol.iterator](): Generator<T>;
}
```

## Truncating a collection

Collections can be efficiently shortened without repeatedly calling `pop()`.

```ts
const queue = new FIFO<number>();

queue.push(1);
queue.push(2);
queue.push(3);
queue.push(4);

queue.truncate(2);

Array.from(queue);
// [1, 2]
```

Calling `truncate()` without an argument clears the collection.

```ts
queue.truncate();

console.log(queue.length);
// 0
```

Passing a value larger than the current length has no effect.

## Iteration

Collections implement the JavaScript iteration protocol.

```ts
Array.from(queue);

[...queue];

for (const value of queue) {
    // ...
}
```

`map()` and `forEach()` traverse elements in the same order as the iterator.

For `FIFO`, this is insertion order.

For `LIFO`, this is stack order (top to bottom).

## Complexity

| Operation | Complexity |
|-----------|-----------:|
| `push()` | O(1) |
| `pop()` | O(1) |
| `length` | O(1) |
| `truncate()` | O(k)¹ |
| `map()` | O(n) |
| `forEach()` | O(n) |
| Iteration | O(n) |

¹ Where *k* is the number of removed elements.

## Notes

### `pop()` and `undefined`

The collections accept `undefined` as a valid value.

As a result, the return value of `pop()` alone cannot distinguish between:

```ts
queue.push(undefined);
queue.pop();
```

and

```ts
emptyQueue.pop();
```

If this distinction is important, check `length` before calling `pop()`.

### Mutating during iteration

Modifying a collection while iterating over it results in **undefined behavior**.

Collections intentionally avoid iterator snapshots or mutation tracking in order
to keep the implementation lightweight and performant.

## Roadmap

This package is intended to grow into a general-purpose collection library for
the Shinka ecosystem.

Planned additions include:

- Circular buffers
- Tree-based collections
- Additional shared collection interfaces
- Other specialized data structures
