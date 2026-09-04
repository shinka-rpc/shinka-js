# @shinka-rpc/outscope

Symmetric RPC bus

`@shinka-rpc/outscope` defines a minimal interface for subscribing to the end
of an execution scope.

The library intentionally does **not** define what a *scope* is. A scope may
represent a browser page, a Node.js process, an Express application, a worker,
a test environment, or any other execution context. The owner of the context
is responsible for defining its lifetime and providing an appropriate
implementation.

## Why?

Libraries often need to release resources when the surrounding execution
context ends.

The problem is that every environment exposes its own API:

* Browser pages use `beforeunload`.
* Node.js processes use the `exit` event.
* Other runtimes and frameworks may define their own lifecycle.

As a result, reusable libraries either become coupled to a specific runtime
or need to know implementation details of every supported environment.

`@shinka-rpc/outscope` solves this by defining a single, runtime-agnostic
interface. Libraries depend only on this interface, while applications
provide an implementation appropriate for their execution context.

For example, `@shinka-rpc/core` uses `OutScope` without making any
assumptions about where it is running.

## The interface

```ts
export type OutScopeEventListener = () => void;

export type OutScopeListenerManager = (
  listener: OutScopeEventListener,
) => void;

export type OutScope = {
  add: OutScopeListenerManager;
  remove: OutScopeListenerManager;
};
```

The interface deliberately contains only the operations required to
subscribe and unsubscribe listeners.

Unlike DOM events, there is no event object and no `EventTarget`. Every
implementation represents exactly one event: the end of the associated scope.

## Implementations

This package provides several ready-to-use implementations as examples and
convenience adapters.

### Browser page

```ts
import outscope from "@shinka-rpc/outscope/browser-page";
```

The browser page adapter is backed by the `beforeunload` event.

### Node.js process

```ts
import outscope from "@shinka-rpc/outscope/node-process";
```

The Node.js adapter is backed by the process `exit` event.

### Test environments

A mock implementation is also provided for testing.

## Creating your own implementation

Implementing `OutScope` is straightforward.

```ts
import type { OutScope } from "@shinka-rpc/outscope";

const outscope: OutScope = {
  add(listener) {
    // register listener
  },

  remove(listener) {
    // unregister listener
  },
};

export default outscope;
```

The meaning of "scope" is entirely defined by the implementation. For example,
an implementation may represent:

* a browser page;
* a Node.js process;
* an Express application;
* a worker;
* a plugin;
* a test fixture;
* or any other execution context.

## Usage

Applications provide an `OutScope` implementation, while libraries simply
consume it.

```ts
import browserPage from "@shinka-rpc/outscope/browser-page";

const client = new Client({
  outscope: browserPage,
  transport,
});
```

This separation keeps reusable code independent from platform-specific
lifecycle APIs and allows the same library to work across different
environments without knowing how a particular scope is implemented.
