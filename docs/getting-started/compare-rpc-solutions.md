# 🚧 Shinka RPC Compared with Other RPC Solutions

## Introduction

Shinka RPC is a modular TypeScript communication library for applications that need RPC, event-based messaging, and control over the underlying connection.

Rather than tying communication to a particular transport or serialization format, `@shinka-rpc/core` separates the connection lifecycle, transport, serializer, and optional liveness monitoring. This makes it possible to adapt the same communication model to different runtimes and communication channels.

Shinka RPC is not intended to replace every RPC framework. Some alternatives provide a higher-level developer experience, integrated runtime validation, generated clients, or a mature server ecosystem. Shinka RPC focuses on a composable communication foundation, explicit lifecycle management, and control over protocol overhead.

This article compares Shinka RPC with several alternatives across bundle size, transport flexibility, runtime compatibility, serialization, reliability, type safety, concurrency, extensibility, and network overhead.

## Comparison methodology

The comparison uses 14 criteria:

1. Bundle size
2. Transport flexibility
3. Runtime compatibility
4. Serialization
5. Liveness detection
6. Connection lifecycle
7. Communication model
8. Type safety and validation
9. Concurrency and delivery
10. Extensibility
11. Dependencies and modularity
12. Unique features
13. Maturity and ecosystem
14. Network overhead

The comparison includes both RPC libraries and communication frameworks. These are not interchangeable categories: for example, JSON-RPC defines a protocol, Comlink provides an abstraction over message passing, and Socket.IO defines its own event-oriented protocol and connection behavior.

The package sizes below are version-specific published-package measurements reported by Bundlephobia. They are useful for an initial comparison, but they are not a perfect measure of the code a particular application will ship. Different packages have different responsibilities, and tree shaking, bundler configuration, adapters, and application usage can all affect the final result.

Capabilities should also be distinguished from guarantees. A framework that supports reconnection, for example, does not necessarily guarantee that a request interrupted by disconnection will be executed exactly once.

## 1. Bundle size

The following table records the reported package sizes for the selected versions.

| Library or package | Version | Minified | Minified + gzip |
|---|---:|---:|---:|
| `@shinka-rpc/core` | `0.1.0-alpha.13` | 19.4 kB | 6.7 kB |
| `comlink` | `4.4.2` | 4.2 kB | 1.9 kB |
| `@trpc/client` | `11.19.0` | 32.5 kB | 10.2 kB |
| `json-rpc-2.0` | `1.8.1` | 15.5 kB | 3.8 kB |
| `@grpc/grpc-js` | `1.14.6` | 392.5 kB | 101.4 kB |
| `grpc-web` | `2.1.1` | 26 kB | 10.2 kB |
| `socket.io-client` | `4.8.4` | 41.1 kB | 12.7 kB |
| `socket.io` | `4.8.4` | 265.9 kB | 54.5 kB |
| `tsrpc-browser` | `3.4.18` | 172.4 kB | 49.1 kB |
| `tsrpc` | `3.4.21` | 147.3 kB | 39.7 kB |
| `rpc-websockets` | `10.0.1` | 34 kB | 10.3 kB |
| `@connectrpc/connect` | `2.2.0` | 49.4 kB | 13.5 kB |
| `@connectrpc/connect-web` | `2.2.0` | 8.6 kB | 2.4 kB |
| `@effect/rpc` | `0.76.2` | 67.3 kB | 22.1 kB |

These figures should not be interpreted as a strict ranking of efficiency. Some entries are browser-oriented clients, while others represent server implementations or broader framework packages. In particular, `@grpc/grpc-js` is a Node.js gRPC implementation, not a browser client directly comparable to `grpc-web`.

The `@connectrpc/connect` and `@connectrpc/connect-web` packages also serve different roles, so their sizes should not simply be added or compared as if they were equivalent implementations.

For Shinka RPC, the reported size increased from **17.4 kB minified / 6.0 kB minified + gzip** in `0.1.0-alpha.12` to **19.4 kB / 6.7 kB** in `0.1.0-alpha.13`. The increase accompanies ongoing development, including lifecycle improvements, a reconnect scenario, and request cancellation support. The size figures alone do not establish how much each feature contributes.

A separate minimal-bundle measurement previously reported 11.9 kB minified and 4.5 kB gzip for Shinka RPC. That measurement used a different methodology and should not be mixed into the Bundlephobia table.

## 2. Transport flexibility

Transport choice determines where and how peers can communicate.

| Library | Transport model |
|---|---|
| **Shinka RPC** | Pluggable transport abstraction |
| **Comlink** | Message-passing endpoints, typically `postMessage` |
| **tRPC** | Configurable links and protocol adapters |
| **JSON-RPC 2.0** | Transport-independent protocol |
| **gRPC** | HTTP/2-based RPC |
| **gRPC-Web** | Browser-compatible gRPC protocol over HTTP |
| **Socket.IO** | Its own event-oriented protocol over supported underlying transports |
| **TSRPC** | HTTP and WebSocket-oriented communication |
| **rpc-websockets** | WebSocket-based RPC |
| **Connect RPC** | Connect, gRPC, and gRPC-Web-compatible protocols |
| **Effect RPC** | RPC abstraction with supported protocol and transport integrations |

Shinka RPC's transport abstraction is one of its central architectural decisions. The communication layer is not inherently tied to WebSocket or a single browser API. Transport implementations can adapt the library to different communication environments.

This is useful when an application needs to communicate across different kinds of execution contexts, such as a page and a worker, or when the transport must change without rewriting application-level messaging.

Comlink is especially natural when both peers expose objects through compatible message-passing endpoints. Socket.IO is more opinionated: its protocol, event semantics, and connection behavior are part of the solution rather than merely an interchangeable transport.

JSON-RPC is different again. It specifies a message format and interaction conventions but does not prescribe a transport implementation.

**Trade-off:** Shinka RPC's flexibility comes with a responsibility to configure compatible transports and serializers. A more opinionated framework may require less initial setup for a narrowly defined use case.

## 3. Runtime compatibility

Runtime compatibility depends on both the communication model and the actual transport implementation.

- **Shinka RPC** separates the core communication layer from transport and serialization adapters, allowing implementations to target different runtimes.
- **Comlink** is a strong fit for environments that support message passing, including Web Workers.
- **tRPC** is primarily associated with TypeScript applications using its supported client and server adapters.
- **JSON-RPC 2.0** can be implemented in virtually any runtime because it is a protocol rather than a complete runtime framework.
- **gRPC** has a broad server ecosystem, while browser applications commonly use gRPC-Web or Connect-compatible alternatives.
- **Socket.IO** provides browser and server implementations, with its own protocol and supported transport behavior.
- **TSRPC**, **rpc-websockets**, **Connect RPC**, and **Effect RPC** each have their own runtime and adapter requirements.

It is important to distinguish protocol compatibility from implementation availability. A protocol may be suitable for a runtime even when a particular library package does not support that runtime directly.

For Shinka RPC, compatibility should be evaluated at the level of the selected transport and serializer, not inferred solely from the core package.

## 4. Serialization

Serialization determines the representation of application data on the wire. It can affect bundle size, CPU usage, message size, and which values can be transmitted.

Shinka RPC separates serialization from communication. Its serializer abstraction supports different implementations, including JSON and adapters for formats such as BSON, MessagePack, and YAML. Higher-order serializer utilities can also compose transformations such as compression or encoding.

This separation makes it possible to choose a format according to the application's requirements rather than adopting one serialization format for every use case.

Other libraries make different trade-offs:

- **Comlink** relies on the underlying structured-clone/message-passing model and supported transferable values rather than defining a general-purpose wire serializer.
- **tRPC** uses its configured data transformer and link architecture.
- **JSON-RPC 2.0** describes JSON messages and does not define a binary encoding.
- **gRPC** commonly uses Protocol Buffers.
- **gRPC-Web** uses the gRPC-Web protocol and its supported message encodings.
- **Socket.IO** has its own packet protocol and parser, with support for serializing application data and binary attachments.
- **TSRPC**, **Connect RPC**, and **Effect RPC** offer their own serialization and protocol options.

There is no universally best format. JSON is easy to inspect and interoperates well with many systems. Binary formats can reduce payload size or parsing costs in some situations, but may require additional dependencies and tooling.

Shinka RPC's advantage is that serialization is a replaceable component. Its trade-off is that users must select, configure, and test the serializer that fits their application.

## 5. Liveness detection

A working transport does not necessarily mean that the remote application is responsive. A connection may remain apparently open while one peer has stopped responding or become unreachable.

Shinka RPC supports optional liveness monitoring through its LiMon integration. A monitor can use heartbeat messages and timeouts to detect a peer that no longer responds within the configured limits.

This capability is distinct from transport-level connection status. For example, a WebSocket may still report itself as open even when useful communication with the other application is no longer progressing.

The alternatives vary:

- **Socket.IO** has built-in heartbeat and connection-management behavior.
- **gRPC** and **Connect RPC** have their own mechanisms and configuration options for connection and call behavior, but these should not be equated automatically with application-level liveness monitoring.
- **JSON-RPC 2.0** does not define liveness detection.
- **Comlink** does not, by itself, provide a general heartbeat-based connection monitor.
- Other libraries may rely on transport events, request timeouts, framework-specific mechanisms, or application code.

Liveness detection does not guarantee that a failed request can be safely retried. It helps identify a communication problem; the application still needs a policy for handling in-flight work.

## 6. Connection lifecycle

Connection lifecycle management is an important part of communication infrastructure. Applications may need to start and stop connections explicitly, recover after failures, or coordinate multiple asynchronous operations that affect the same connection.

Shinka RPC exposes an explicit lifecycle through operations such as `start`, `stop`, and `restart`. The latest lifecycle implementation is designed to make state transitions more predictable when operations overlap or are re-entered.

The distinction matters: concurrent or re-entrant lifecycle calls need not be treated as exceptional merely because they overlap. A lifecycle implementation can coordinate those calls so that callers observe consistent transitions instead of competing independent start/stop sequences.

Shinka RPC also includes a `reconnect` scenario, providing a reusable way to describe reconnection behavior rather than requiring every application to build that workflow from scratch.

These are separate capabilities:

- **Lifecycle coordination** defines how the connection responds to start and stop operations, including overlapping calls.
- **Reconnection** defines how communication is restored after a connection becomes unavailable.
- **Request recovery** determines what happens to requests that were in flight when the connection failed.

Supporting reconnection does not automatically imply request replay, exactly-once execution, or recovery of application state. Those guarantees depend on the scenario's implementation and the application's protocol.

Other frameworks offer varying degrees of lifecycle automation. Socket.IO provides built-in reconnection behavior. Other RPC clients may leave reconnect policy to the application, transport adapter, or surrounding runtime.

Shinka RPC's approach favors an explicit, composable lifecycle with a reusable reconnect scenario. This offers control over connection behavior, but it is worth documenting the exact guarantees of each scenario separately from the core lifecycle contract.

## 7. Communication model

The libraries compared here differ significantly in what they consider a communication primitive.

- **Shinka RPC** provides connection-level communication through `Bus`, with request/response messaging and event-based messaging. The `Client` abstraction represents a one-to-one communication endpoint; the word *client* does not necessarily imply a client/server role.
- **Comlink** exposes remote objects and methods through a proxy-like abstraction.
- **tRPC** centers on typed procedure calls, with support for subscriptions through configured links and adapters.
- **JSON-RPC 2.0** defines requests, responses, notifications, and errors.
- **gRPC** centers on service methods and supports unary and streaming RPC patterns.
- **Socket.IO** centers on events and acknowledgements.
- **TSRPC** provides typed RPC calls within its own framework.
- **rpc-websockets** provides RPC calls over WebSocket.
- **Connect RPC** focuses on service and procedure calls compatible with its supported protocols.
- **Effect RPC** integrates RPC into the Effect programming model.

Shinka RPC is useful when an application needs a communication foundation that can support more than one higher-level interaction pattern. It does not force every interaction to be modeled as a remote method call.

The flip side is that developers may need to build more application-specific abstractions themselves than they would with a framework that generates procedure clients and server handlers.

## 8. Type safety and validation

Type safety and runtime validation solve related but different problems.

TypeScript can check that application code uses a declared API consistently at compile time. Runtime validation checks the actual data received from a remote peer, which may be running a different version or may not follow the expected contract.

**tRPC** is especially attractive for applications that want end-to-end TypeScript types across client and server code. Other frameworks provide generated service types, schemas, or runtime validation mechanisms, depending on the stack.

**JSON-RPC 2.0** defines the message protocol but does not prescribe TypeScript types or runtime schemas. **gRPC** and **Connect RPC** commonly use service definitions and generated code. **TSRPC** emphasizes typed RPC contracts and runtime validation.

Shinka RPC provides a communication layer rather than prescribing a complete service-definition and validation system. Application-level types and runtime validation therefore depend on how the application builds on the core and which additional libraries it uses.

This is an architectural trade-off, not a claim that one approach is universally safer. A typed API without runtime validation can still receive unexpected data across a network boundary; conversely, runtime validation does not by itself provide a convenient typed developer experience.

## 9. Concurrency, cancellation, and delivery

RPC behavior under concurrency is often more important than the happy path. Multiple requests may be in flight at once, a timeout may occur, a connection may close, or the caller may no longer need the result.

Shinka RPC supports request/response correlation and now supports cancellation through the standard `AbortController` and `AbortSignal` APIs for `request` and `onRequest`.

This gives application code a familiar way to signal that an operation should be cancelled, and to handle cancellation without inventing a separate cancellation API for every application-level request.

Cancellation should not be confused with guaranteed rollback. Once a remote handler has started performing side effects, aborting the request does not automatically undo those effects. Applications should decide how handlers respond to cancellation and whether an operation is safe to retry.

The `AbortSignal` integration is particularly useful for work tied to a UI lifecycle, deadlines, or a parent operation that may be cancelled. It can also help release resources associated with work that is no longer needed.

Other frameworks differ in their cancellation models:

- **gRPC** has established cancellation and deadline concepts.
- **Connect RPC** supports cancellation through its request and call APIs.
- **tRPC** behavior depends on the procedure type and configured transport; cancellation and termination semantics should be checked for the particular adapter.
- **Comlink** does not automatically make arbitrary remote work cancellable; cancellation typically needs an explicit application-level mechanism.
- **JSON-RPC 2.0** does not standardize request cancellation.
- **Socket.IO** acknowledgements and connection behavior do not by themselves define general RPC cancellation semantics.

Delivery guarantees must be considered separately from cancellation. None of these mechanisms should be assumed to provide exactly-once execution across disconnects unless the framework and application protocol explicitly implement that guarantee.

## 10. Extensibility

Shinka RPC is built around replaceable components. The core communication model is separated from transports, serializers, and optional liveness monitoring, while higher-order utilities can compose additional behavior.

This makes it possible to extend the system without turning the core into a framework that must own every transport and encoding decision.

Other libraries provide different extension points:

- **tRPC** uses links and adapters.
- **Comlink** works with compatible endpoints and supports custom transfer handlers for values that require special treatment.
- **Socket.IO** has extension points around its client/server architecture and protocol integrations.
- **Connect RPC** exposes transport and protocol configuration.
- **gRPC** has a broad ecosystem of generated clients, interceptors, and middleware.
- **JSON-RPC 2.0** is extensible at the application and transport level, but the protocol itself does not supply a plugin architecture.

Extensibility is not automatically a benefit in every project. If an application needs one standard transport and a conventional RPC interface, a more opinionated library may be simpler. If the communication layer must be adapted to different environments or requirements, component-level extensibility becomes more valuable.

## 11. Dependencies and modularity

A modular architecture can keep the core focused, but it can also mean that the complete feature set is distributed across multiple packages.

Shinka RPC follows this modular approach. The core handles communication and lifecycle behavior, while separate packages provide utilities and integrations, including transport and serializer building blocks.

This can help applications select the pieces they need rather than adopting an entire framework. However, the actual dependency footprint must be measured for the selected configuration; a modular package design does not guarantee that every resulting bundle is smaller.

Other solutions make different choices. Comlink is comparatively small because its scope is narrower. A protocol implementation such as `json-rpc-2.0` can also be small, but applications may need to supply the transport, reconnection, validation, and lifecycle policies separately.

Conversely, a larger package may include valuable functionality that would otherwise need to be implemented and maintained by the application.

A fair comparison should therefore ask both *how much code is included* and *which capabilities that code provides*.

## 12. Unique features

Shinka RPC's distinguishing features are best understood as a combination of architectural choices and reusable communication utilities:

- **Connection-level `Bus` abstraction.** Communication is modeled independently of a particular client/server role.
- **Explicit lifecycle management.** Start, stop, and restart behavior is managed centrally, with more predictable handling of overlapping transitions in the current implementation.
- **Reusable reconnect scenario.** Applications can build on an existing reconnection workflow instead of duplicating the orchestration.
- **Request cancellation.** `request` and `onRequest` support the standard `AbortController` / `AbortSignal` model.
- **Replaceable transports and serializers.** Applications can choose how messages are transported and encoded.
- **Optional liveness monitoring.** Heartbeats and timeout-based monitoring can detect an unresponsive peer.
- **Extensible message handling.** Request/response and event-based communication can be used as building blocks for higher-level patterns.
- **Exclusive communication lock.** The associated ecosystem provides a lock mechanism for coordinating protocol transitions while preventing writes to the transport during the lock.

The exclusive lock is useful for operations that require a quiet transport, such as coordinating a protocol or encryption-key rotation. It should not be described as guaranteeing that no messages are pending: its purpose is to prevent writes while the lock is held, with buffered messages sent after release.

These features do not make Shinka RPC a replacement for every higher-level framework. Rather, they define the kind of control it offers to applications that need to assemble their own communication architecture.

## 13. Maturity and ecosystem

Maturity includes more than package age or popularity. It can involve API stability, documentation, testing, compatibility guarantees, operational experience, and the availability of integrations.

Shinka RPC's core package is still in the `0.1.0-alpha` series in the version measured here. Its architecture and feature set are evolving, so users should take that maturity level into account when choosing it for production-critical applications.

Established projects such as Socket.IO, gRPC, and tRPC have broader adoption and more extensive surrounding ecosystems. Comlink has a focused role in JavaScript message passing. Connect RPC and Effect RPC serve developers with particular protocol or programming-model preferences.

These projects are not all direct competitors in every use case. Their relative maturity should be evaluated alongside the application requirements rather than treated as a substitute for technical fit.

For Shinka RPC, the modular design and growing set of reusable scenarios are strengths, while the pre-1.0 status is an important qualification for prospective users.

## 14. Network overhead

Protocol overhead is the extra data required to represent a message beyond the application's payload. Lower overhead can matter for frequent small messages, but it is only one factor in total communication cost.

For a meaningful comparison, measurements need to use the same payload, serializer, transport framing, and definition of payload. The figures below are preliminary measurements from the Shinka RPC tests and a Socket.IO packet example; they should not be interpreted as a complete benchmark of every library in this article.

### Shinka RPC

The measured Shinka RPC overhead with the tested JSON serializer was:

| Message type | Reported protocol overhead |
|---|---:|
| Event | 9 bytes |
| Request | At least 11 bytes |
| Successful response | 6 bytes |
| Error response | 6 bytes |

The application payload is excluded from these values. For example, an event's application data can be a key/value pair such as `"event"` and `"hello"`; the protocol overhead is the additional serialized structure required to transmit it.

Request and response messages also carry a request identifier. Its decimal representation grows as the identifier grows, so the overhead of a request is not a single constant for all possible identifier values. The reported request overhead is therefore a minimum for the tested representation, not a universal fixed size.

### Socket.IO

A representative Socket.IO event packet is:

```text
42["hello","world"]
```

Using the same payload definition—excluding the application values `"hello"` and `"world"`—the packet structure contributes approximately 5 bytes in this example.

This is a useful illustration, but not yet a complete apples-to-apples benchmark. A rigorous comparison would need to account for the exact Socket.IO packet type, namespace, acknowledgements, binary attachments where applicable, and the transport framing in the chosen test.

### Other protocols

Some protocols define additional framing or structured fields that affect their wire representation:

- **JSON-RPC 2.0** uses fields such as `jsonrpc`, `method`, `params`, and `id`. The resulting overhead depends on the message type, property names, identifier representation, and JSON encoding.
- **gRPC** uses a message framing prefix containing a compression flag and a four-byte message length, in addition to the encoded message and the surrounding transport protocol.
- **Comlink** uses its own message conventions over structured-clone-compatible endpoints; the representation depends on the operation and transferred values.
- **Connect RPC**, **TSRPC**, **tRPC**, and **rpc-websockets** have their own protocol fields, framing, and serialization choices, so exact overhead needs to be measured for a specific request or event.

A single overhead number cannot fairly represent a protocol across all message types. A useful benchmark should publish the exact wire messages, payload, serialization mode, and measurement method.

### Interpretation

The current measurements suggest that Shinka RPC can keep the protocol structure for small messages compact. They do not, on their own, prove that Shinka RPC has the lowest overhead among all the alternatives.

To establish that, the same test harness should serialize equivalent event, request, success, and error messages for each candidate and report the resulting byte counts. Where a library requires transport framing or multiple protocol layers, those bytes should be measured separately and then included in an end-to-end total.

## Summary

Shinka RPC is best considered a modular communication foundation rather than a fully opinionated RPC framework.

Its strengths include a replaceable transport and serialization architecture, explicit connection lifecycle management, optional liveness monitoring, a reusable reconnect scenario, and request cancellation through standard abort APIs. These capabilities are useful when an application needs control over connection behavior and wants to compose its own communication patterns.

Other libraries may be a better fit when the priority is a particularly small message-passing abstraction, end-to-end TypeScript procedure types, generated service definitions, a mature event platform, or a standardized RPC protocol.

The right choice depends on which responsibilities the application wants the library to own. Bundle size and protocol overhead matter, but so do lifecycle guarantees, cancellation semantics, runtime support, validation, and the maintenance burden of integrating the missing pieces.
