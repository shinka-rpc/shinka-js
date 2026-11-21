# Transport Context

## Overview

`@shinka-rpc/core` provides a way to access the context created by a transport implementation.

A transport context is an implementation-specific object associated with a particular transport initialization. It may expose the underlying communication resource or provide access to additional capabilities of the transport.

The context is optional. Each transport implementation decides whether to create one and what information to expose.

For example:

- A WebSocket transport may expose its underlying `WebSocket` instance.
- A browser extension transport may expose the `chrome.runtime.Port` instance, allowing access to additional Chrome Extensions API capabilities.
- Some transports may have no useful context to expose.

## The `complete` callback

The `complete` callback provides access to the transport context and the `IBus` instance associated with it.

It is supported by the main communication abstractions of `@shinka-rpc/core`:

- `Client`
- `Server`
- `Hub`
- `Pool`

Its type is:

```ts
export type CompleteFn<SO, TO, TC> = (
  ctx: TC,
  thisArg: IBus<SO, TO>,
) => void;
```

Arguments:

- `ctx` — the context provided by the transport implementation.
- `thisArg` — the `IBus` instance associated with the transport initialization.

The callback is invoked immediately after transport and serializer initialization has completed, but before the Liveness Monitor (`LiMon`) is initialized.

This allows application code to access both the transport-specific context and the corresponding communication interface as soon as the transport and serializer are ready.

## Context lifetime

A transport context belongs to a particular transport initialization. When the transport is initialized again, a new context is expected to be provided. The previous context should be considered invalid after its associated transport instance has been closed.

Transport implementations should provide a context associated with the individual transport instance whenever such a context exists. Reusing a context across transport initializations should generally be avoided.

The `complete` callback is invoked on every transport initialization.

For example, when a `Client` is restarted, its transport is initialized again and `complete` receives the context associated with the new initialization.

Consequently, applications should not assume that the context remains the same across restarts.

## Transport-specific contexts

Transport contexts are deliberately not standardized by `@shinka-rpc/core`.

This keeps the core abstraction independent of transport-specific APIs while allowing individual transports to expose useful implementation details.

For example, a browser extension transport can expose its underlying `chrome.runtime.Port`. An application can then use the returned object to access functionality that is not part of the generic messaging interface provided by `IBus`.

In contrast, a transport that does not create a separately useful context does not need to provide one.

## Design considerations

The transport context is an integration point, not a replacement for the messaging API.

Use the standard `Client`, `Server`, `Hub`, or `Pool` interfaces for communication. Access the transport context when an application needs capabilities specific to the underlying transport.

Applications should avoid assuming that contexts have the same structure or capabilities across different transport implementations.
