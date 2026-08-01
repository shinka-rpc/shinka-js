# @shinka-rpc/util

Symmetric RPC bus

This package implements auxiliary utilities

## sequence

Simple factory function, returning database-like sequence -- the function
returning auto-incrementing value

```typescript
import { sequence } from "@shinka-rpc/util";

const fromZero = sequence();
const fromFive = sequence(5);

// [fromZero(), fromZero(), fromZero()] === [0, 1, 2]
// [fromFive(), fromFive(), fromFive()] === [5, 6, 7]
```

**API Reference**:

- **Optional** initialValue: `Number`

## sleep

Simple wrapper over `setTimeout` and `Promise`

```typescript
import { sleep } from "@shinka-rpc/util";

await sleep(250);
```

**API Reference**:

- **Required** time: `Number` of milliseconds, passed directly to `setTimeout`

## delegate

Implements [delegate](https://en.wikipedia.org/wiki/Delegation_pattern) pattern
in `forwardRef` manner to make possible late binding to resolve circular
dependency problem

```typescript
import { delegate } from "@shinka-rpc/util";

const defaultFn = () => console.error("Implementation is not ready!");
const {call, set, reset} = delegate<(a1: any, a2: any /*, ...*/) => any>(defaultFn);
const dependency1 = new Dependency1(call);
const dependency2 = new Dependency2(dependency1);
set(dependency2.someMethod.bind(dependency2));
// now `dependency1` can use `dependency2.someMethod`
```

**API Reference**:

- **Required** defaultFn: Any your placeholder function / null-object

**Returns** object `Delegate`: `{ call, set, reset }`

## `disposeContext` and `asyncDisposeContext`

### Why?

ECMAScript introduced the `Disposable` and `AsyncDisposable` protocols together
with the `using` and `await using` syntax for deterministic resource cleanup.
While the protocols are available in modern TypeScript, the language syntax is
still not universally supported across JavaScript runtimes. In particular,
Safari still lacks support for `using` / `await using`, and a significant
percentage of users continue to rely on browsers without this feature.

This package provides a tiny compatibility layer that lets you adopt the
standardized disposal API today without depending on syntax support.

It creates objects implementing `Disposable` and `AsyncDisposable` by exposing
both the standard symbol (`Symbol.dispose` / `Symbol.asyncDispose`) and an
explicit method pointing to the same cleanup function.

### Usage

#### Modern environments

When `using` is available, use it as intended:

```typescript
using ctx = disposeContext(() => cleanup());

// User-defined logic
```

```typescript
await using ctx = asyncDisposeContext(async () => cleanup());

// User-defined logic
```

#### Compatibility mode

For environments that do not support `using`, call the cleanup method explicitly:

```typescript
const ctx = disposeContext(() => cleanup());

try {
  // User-defined logic
} finally {
  ctx.dispose();
}
```

```typescript
const ctx = asyncDisposeContext(async () => cleanup());

try {
  // User-defined logic
} finally {
  await ctx.aDispose();
}
```

### How it works

The library is intentionally minimal. It does not implement a disposal framework
or manage resources on your behalf.

It simply returns an object that exposes the same cleanup function through both:

* the standard `Symbol.dispose` / `Symbol.asyncDispose` protocol;
* an explicit `release()` / `aRelease()` method for environments where `using`
is unavailable.

This allows the same API to work with both modern `using` syntax and traditional
`try`/`finally` blocks, making it easy to adopt the standard today and
transition seamlessly as runtime support improves.
