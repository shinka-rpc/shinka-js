# @shinka-rpc/core

![minzip](https://badgen.net/bundlejs/minzip/@shinka-rpc%2Fcore)

**The core communication layer of Shinka-RPC.**

`@shinka-rpc/core` provides a transport-independent foundation for building symmetric RPC communication channels. It handles message exchange, remote procedure calls, event delivery, and connection lifecycle management.

The core deliberately abstracts away the underlying communication environment. Instead, its dependencies are supplied through independent components, allowing the same communication logic to work across different platforms and communication channels.

![How @shinka-rpc works](https://raw.githubusercontent.com/shinka-rpc/shinka-js/66e1552e57d63c30b2122387f06c4bb354c7e87f/docs/img/shinka-structure.svg)

## Architecture

The main building block is `Bus` — a connection-level primitive responsible for communication between two endpoints. `Hub` provides low-level management of multiple `Bus` instances.

On top of `Bus` and `Hub`, the package provides higher-level abstractions:

- **Client** — a one-to-one communication endpoint.
- **Server** — manages multiple client connections through a `Hub`.
- **Pool** — manages a collection of reusable connections through a `Hub`.

Communication is symmetric: either endpoint can initiate a connection, send requests and events, and register handlers to receive them.

## Environment Integration

The distinctive feature of ShinkaRPC is **Outscope** — a mandatory environment integration mechanism designed as a dependency rather than an implicit runtime assumption.

To make the core operational, you need to provide:

- **Outscope** — integrates the core with its execution environment.
- **Transport** — defines how messages are exchanged between endpoints.
- **Serializer** *(optional)* — defines how messages are encoded and decoded.
- **LiMon** *(optional)* — provides additional connection monitoring capabilities.

This separation keeps the core independent of specific environments, communication mechanisms, and serialization formats.

## Documentation

See the [full documentation](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/core/) for architecture details, API reference, lifecycle behavior, and usage examples.
