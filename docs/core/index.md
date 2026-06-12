# Core

Ironically the `core` know how to do everything but it is made so abstract that
as it unable to do anything. So to make `@shinka-rpc` be able to do things, you
have to pass the **transport** &mdash; commonly very small function, returning 2
functions: `send` and `close`, and subscribing the `bus` instance to `onMessage`.

# How `@shinka-rpc` works

There are main components of `@shinka-rpc`:

![diagram](../img/how-shinka-rpc-works.svg "How `@shinka-rpc` works")

But actually `bus` is a bit more complex:

![diagram](../img/bus-shinka.svg "`Bus` structure")

I explain this at [Shinka](./shinka) article

# [Client](./client) and [Server](./server)

The only difference between [Server](./server) and [Client](./client)
that [Server](./server) accepts multiple connections, but the
[Client](./client) accepts only one

::: tip
In some cases like
[@shinka-rpc/dedicated-worker](https://www.npmjs.com/package/@shinka-rpc/dedicated-worker)
both sides accepts only one connection. Who of them is [Server](./server)?

No one. It's OK scenario [Client](./client) &longleftrightarrow; [Client](./client)
:::

[Server](./server) can initialize connections by itself, so reverse-server
and hybrid scenarios are also available

# Registry

This is the way how to control client's connect and disconnect
