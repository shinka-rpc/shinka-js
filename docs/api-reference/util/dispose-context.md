# `disposeContext` and `asyncDisposeContext`

Small compatibility helpers for the ECMAScript `Disposable` and `AsyncDisposable` protocols.

These functions create frozen context objects that expose a cleanup function through both the standard disposal symbol and an explicit method.

## Why?

ECMAScript provides the `Disposable` and `AsyncDisposable` protocols, together with the `using` and `await using` declarations, for deterministic resource cleanup.

However, runtime support for these protocols and the corresponding language syntax is not universal.

`@shinka-rpc/util` provides a lightweight compatibility layer that allows the same disposal API to be used with both modern syntax and traditional `try` / `finally` blocks.

The library ensures that `Symbol.dispose` and `Symbol.asyncDispose` are available, providing fallback symbols through `Symbol.for()` when necessary.

**Note:** This compatibility layer provides the disposal symbols and context objects. It does not polyfill the `using` or `await using` language syntax. A compatible runtime or transpilation step is still required to use that syntax.

## Usage

### Synchronous disposal

**Using `using`:**

```typescript
import { disposeContext } from "@shinka-rpc/util";

using ctx = disposeContext(() => cleanup());

// User-defined logic
```

The cleanup function is automatically called when the scope exits.

**Compatibility mode:**

```typescript
const ctx = disposeContext(() => cleanup());

try {
  // User-defined logic
} finally {
  ctx.dispose();
}
```

### Asynchronous disposal

**Using `await using`:**

```typescript
import { asyncDisposeContext } from "@shinka-rpc/util";

await using ctx = asyncDisposeContext(async () => cleanup());

// User-defined logic
```

The cleanup function is awaited when the scope exits.

**Compatibility mode:**

```typescript
const ctx = asyncDisposeContext(async () => cleanup());

try {
  // User-defined logic
} finally {
  await ctx.aDispose();
}
```

## How it works

Both helpers return frozen objects exposing the same cleanup function through two interfaces:

| Helper | Standard protocol | Explicit method |
|---|---|---|
| `disposeContext` | `[Symbol.dispose]` | `dispose()` |
| `asyncDisposeContext` | `[Symbol.asyncDispose]` | `aDispose()` |

The standard symbol and explicit method reference the same function. This means both disposal mechanisms have identical behavior.

The returned objects are frozen to prevent accidental modification of their properties.

## API Reference

### `disposeContext`

```typescript
type DisposeContext = Disposable & {
  dispose: () => void;
};

function disposeContext(
  dispose: () => void,
): DisposeContext;
```

| Parameter | Type | Description |
|---|---|---|
| `dispose` | `() => void` | Cleanup function called when the context is disposed. |

**Returns:** `DisposeContext` — a frozen object implementing `Disposable` and exposing `dispose()`.

### `asyncDisposeContext`

```typescript
type AsyncDisposeContext = AsyncDisposable & {
  aDispose: () => Promise<void>;
};

function asyncDisposeContext(
  aDispose: () => Promise<void>,
): AsyncDisposeContext;
```

| Parameter | Type | Description |
|---|---|---|
| `aDispose` | `() => Promise<void>` | Asynchronous cleanup function called when the context is disposed. |

**Returns:** `AsyncDisposeContext` — a frozen object implementing `AsyncDisposable` and exposing `aDispose()`.
