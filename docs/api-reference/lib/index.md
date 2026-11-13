# lib

A collection of small libraries that provide reusable building blocks for Shinka RPC implementations.

These libraries contain functionality that is useful across multiple `@shinka-rpc` packages but does not belong to the core RPC implementation itself.

## Libraries

### [`@shinka-rpc/libtransport`](./libtransport)

Reusable low-level adapters for transport implementations.

### [`@shinka-rpc/libserializer`](./libserializer)

Reusable primitives for implementing serializers, including the high-order serializer framework.

The libraries are intentionally kept independent from the main `@shinka-rpc/core` abstractions whenever possible, so they can be reused by different transports and serializer implementations.
