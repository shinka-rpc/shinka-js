# Core

Ironically the `core` know how to do everything but it is made so abstract that
as it unable to do anything. So to make `@shinka-rpc` be able to do things, you
have to pass the **transport** &mdash; commonly very small function, returning 2
functions: `send` and `close`, and subscribing the `bus` instance to `onMessage`.

# Structure of `@shinka-rpc`

There are main components of `@shinka-rpc`

![diagram](../img/shinka-structure.svg "Structure of `@shinka-rpc`")

## [Client](./client-bus) and [Server](./server-bus)

The only difference between [Server](./server-bus) and [Client](./client-bus)
that [Server](./server-bus) accepts multiple connections, but the
[Client](./client-bus) accepts only one

::: tip
In some cases like
[@shinka-rpc/dedicated-worker](https://www.npmjs.com/package/@shinka-rpc/dedicated-worker)
both sides accepts only one connection. Who of them is [Server](./server-bus)?

No one. It's OK scenario [Client](./client-bus) &longleftrightarrow; [Client](./client-bus)
:::

[Server](./server-bus) can initialize connections by itself, so reverse-server
and hybrid scenarios are also available

## Registry

This is the way how to control client's connect and disconnect
