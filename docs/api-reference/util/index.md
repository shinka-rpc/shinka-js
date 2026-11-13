# Util

A collection of small, dependency-free utilities used across the Shinka RPC ecosystem and beyond.

The package provides lightweight helpers for common programming tasks, including asynchronous operations, object management, function composition, and data formatting. Each utility is independent and can be used on its own.

## Utilities

### Asynchronous utilities

- **[`sleep`](./sleep.md)** — a Promise-based delay with support for `AbortSignal`.
- **[`sequence`](./sequence.md)** — creates independent auto-incrementing sequence generators.

### Function utilities

- **[`delegate`](./delegate.md)** — creates a stable function reference whose implementation can be assigned or replaced later.

### Resource management

- **[`disposeContext`](./dispose-context.md#synchronous-disposal)** — provides explicit disposal through `dispose()` and integration with `Symbol.dispose`.
- **[`asyncDisposeContext`](./dispose-context.md#asynchronous-disposal)** — the asynchronous counterpart, supporting `aDispose()` and `Symbol.asyncDispose`.

Both utilities provide a convenient compatibility layer for disposable resources.

### Object utilities

- **[`clearObject`](./clear-object.md)** — removes an object's own properties while preserving its identity.
- **[`handleCache`](./handle-cache.md)** — retrieves a cached value or creates and stores one when the key is missing.

## Design principles

`@shinka-rpc/util` is intentionally a small toolbox rather than a framework. Its utilities are designed to:

- Solve narrowly scoped, reusable problems.
- Avoid unnecessary dependencies.
- Keep their interfaces and behavior straightforward.
- Remain independent wherever possible, so individual helpers can be adopted without introducing unrelated functionality.
