# `@shinka-rpc/util`

A collection of small, dependency-free utilities used across the Shinka RPC ecosystem and beyond.

The package provides lightweight helpers for common programming tasks, including asynchronous operations, object management, function composition, and data formatting. Each utility is independent and can be used on its own.

## Utilities

### Asynchronous utilities

- **[`sleep`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/util/sleep.html)** — a Promise-based delay with support for `AbortSignal`.
- **[`sequence`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/util/sequence.html)** — creates independent auto-incrementing sequence generators.

### Function utilities

- **[`delegate`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/util/delegate.html)** — creates a stable function reference whose implementation can be assigned or replaced later.

### Resource management

- **[`disposeContext`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/util/dispose-context.html#synchronous-disposal)** — provides explicit disposal through `dispose()` and integration with `Symbol.dispose`.
- **[`asyncDisposeContext`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/util/dispose-context.html#asynchronous-disposal)** — the asynchronous counterpart, supporting `aDispose()` and `Symbol.asyncDispose`.

Both utilities provide a convenient compatibility layer for disposable resources.

### Object utilities

- **[`clearObject`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/util/clear-object.html)** — removes an object's own properties while preserving its identity.
- **[`handleCache`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/util/handle-cache.html)** — retrieves a cached value or creates and stores one when the key is missing.

These utilities implement a more specialized part of the package's functionality and may be extracted into a separate package in the future.

## Design principles

`@shinka-rpc/util` is intentionally a small toolbox rather than a framework. Its utilities are designed to:

- Solve narrowly scoped, reusable problems.
- Avoid unnecessary dependencies.
- Keep their interfaces and behavior straightforward.
- Remain independent wherever possible, so individual helpers can be adopted without introducing unrelated functionality.
