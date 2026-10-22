# 🚧 Shinka RPC Compared with Other RPC Solutions

> **Status: Draft — October 12, 2026.** This comparison is a work in progress. Package sizes are based on Bundlephobia measurements supplied for specific versions. Other characteristics are documented only where sufficient information is available. Missing data is explicitly marked rather than inferred.

## 1. Introduction

Shinka RPC is a TypeScript RPC library designed around a modular architecture. It separates the connection abstraction, transport, serialization, and additional protocol components, allowing applications to choose and extend individual parts.

This article compares Shinka RPC with several alternative approaches to remote procedure calls and bidirectional communication:

- Comlink
- tRPC
- JSON-RPC 2.0
- gRPC and gRPC-Web
- Socket.IO
- TSRPC
- rpc-websockets
- Connect RPC
- Effect RPC
- Metacom

These projects do not all solve the same problem. Some provide an RPC programming model, some define a wire protocol, and others offer a complete communication framework.

Consequently, this comparison does not attempt to establish a universal ranking. Its purpose is to identify architectural trade-offs, practical capabilities, and areas where Shinka RPC could improve.

## 2. Comparison methodology

We evaluate implementations using the following criteria:

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

Three distinctions are important when interpreting the results.

**Specifications versus implementations.** JSON-RPC 2.0 is a protocol specification, not a single library. Its runtime compatibility, bundle size, and reconnect behavior depend on the implementation and transport.

**Client versus server.** Browser clients and Node.js servers have different requirements and bundle sizes. Their measurements must not be treated as interchangeable.

**Implemented versus verified.** A feature may exist in the source code without having adequate tests or documentation. Where verification is incomplete, this article does not assume that the feature is either present or absent.

## 3. Bundle size

Bundle size is often one of the first characteristics developers examine when considering a browser library. It is not a complete measure of value, but it provides a useful, reproducible starting point.

The following figures are measurements reported by Bundlephobia for the specified package versions.

| Package | Version | Minified | Minified + gzip |
|---|---|---:|---:|
| `comlink` | 4.4.2 | 4.2 kB | 1.9 kB |
| `@connectrpc/connect-web` | 2.2.0 | 8.6 kB | 2.4 kB |
| `json-rpc-2.0` | 1.8.1 | 15.5 kB | 3.8 kB |
| `@shinka-rpc/core` | 0.1.0-alpha.12 | 17.4 kB | 6.0 kB |
| `@trpc/client` | 11.19.0 | 32.5 kB | 10.2 kB |
| `grpc-web` | 2.1.1 | 26.0 kB | 10.2 kB |
| `rpc-websockets` | 10.0.1 | 34.0 kB | 10.3 kB |
| `socket.io-client` | 4.8.4 | 41.1 kB | 12.7 kB |
| `@connectrpc/connect` | 2.2.0 | 49.4 kB | 13.5 kB |
| `@effect/rpc` | 0.76.2 | 67.3 kB | 22.1 kB |
| `tsrpc` | 3.4.21 | 147.3 kB | 39.7 kB |
| `tsrpc-browser` | 3.4.18 | 172.4 kB | 49.1 kB |
| `socket.io` | 4.8.4 | 265.9 kB | 54.5 kB |
| `@grpc/grpc-js` | 1.14.6 | 392.5 kB | 101.4 kB |
| `metacom` | Unknown | Unknown | Unknown |

Sources: [Bundlephobia](https://bundlephobia.com/), with package versions fixed as shown in the table.

**Important limitations:**

- These measurements are not all directly comparable. Some packages are browser clients, others are server implementations, and others are protocol or framework components.
- Bundlephobia's package-level measurements do not necessarily represent the minimum application bundle after tree-shaking.
- The figures for `@shinka-rpc/core` describe the published package measurement, not the minimum possible Shinka bundle.

A separate measurement using bundlejs gives a smaller Shinka bundle: **11.9 kB minified and 4.5 kB gzipped**. This is a different measurement methodology and should not be mixed into the Bundlephobia table.

For a meaningful comparison, future measurements should include both the published-package size and a reproducible minimal application build.

### Preliminary observation

Shinka's 6 kB gzipped package measurement is competitive with several established RPC clients and frameworks. It is larger than Comlink and the Connect browser package, but smaller than the measured tRPC, Socket.IO client, and Effect RPC packages.

These figures alone do not establish which implementation offers the best value. That requires comparing equivalent capabilities and configurations.

## 4. Transport flexibility

Transport flexibility determines whether an application can use an existing communication mechanism or must adopt the framework's preferred transport.

| Implementation | Available information |
|---|---|
| Shinka RPC | Designed to separate transport from RPC logic. WebSocket, fetch, SSE, and message-port transports are among the relevant implementations in its ecosystem. Exact package-level support requires verification. |
| Comlink | Uses `postMessage`-compatible endpoints, particularly Web Workers. |
| tRPC | Uses HTTP-based links and supports WebSocket subscriptions and SSE in appropriate configurations. |
| JSON-RPC 2.0 | Transport-independent specification. Transport support depends on the chosen implementation. |
| gRPC | Typically uses HTTP/2. gRPC-Web enables browser communication through a compatible server or proxy. |
| Socket.IO | Provides its own event protocol, generally over WebSocket with HTTP long-polling as a fallback. |
| TSRPC | Supports HTTP and WebSocket. |
| rpc-websockets | Built around WebSocket. |
| Connect | Uses HTTP-based RPC with support for Connect, gRPC, and gRPC-Web protocols in appropriate configurations. |
| Effect RPC | Supports multiple communication and serialization configurations; the exact supported transports need verification. |
| Metacom | Associated with the Metarhia ecosystem and WebSocket-based communication; the exact scope of supported transports needs verification. |

An important question for Shinka is not merely how many transports exist, but whether a developer can implement a new transport without changing application-level RPC handlers.

That distinction should be verified with a small custom transport implementation before making a stronger comparative claim.

## 5. Runtime compatibility

Runtime compatibility is particularly important for applications that share code between browsers, Node.js, Bun, and workers.

| Implementation | Browser | Node.js | Bun |
|---|---|---|---|
| Shinka RPC | Intended use; exact compatibility matrix needed | Needs a versioned test matrix | Needs explicit verification |
| Comlink | Yes, for supported endpoints | Supported endpoint scenarios depend on the environment | Needs explicit verification |
| tRPC | Yes | Yes | Requires version-specific verification |
| JSON-RPC 2.0 | Depends on the library | Depends on the library | Depends on the library |
| gRPC (`@grpc/grpc-js`) | Not directly as a normal browser client | Yes | Needs verification |
| gRPC-Web | Yes, with compatible server infrastructure | Depends on the role and implementation | Needs verification |
| Socket.IO | Yes | Yes | Needs verification |
| TSRPC | Browser client available | Server package available | Needs verification |
| rpc-websockets | Browser and Node.js usage are relevant targets | Yes | Needs verification |
| Connect | Browser support through `connect-web` | Yes | Needs verification |
| Effect RPC | Depends on the selected transport and platform configuration | Relevant supported target; exact matrix needed | Needs verification |
| Metacom | Needs verification | Node.js-oriented ecosystem | Needs verification |

This table is deliberately conservative. Compatibility with JavaScript APIs does not automatically establish official support for a runtime.

A useful follow-up would be to run the same smoke tests on all three targets and record the exact package versions and runtime versions.

## 6. Serialization

Serialization affects interoperability, performance, and the amount of data transferred over the network.

| Implementation | Serialization approach |
|---|---|
| Shinka RPC | Pluggable serializer architecture; JSON is available, with additional serializer packages in the ecosystem. |
| Comlink | Uses structured cloning and transferable objects where supported by the endpoint. |
| tRPC | Typically uses JSON, with configurable transformers for richer data types. |
| JSON-RPC 2.0 | JSON message format by specification. |
| gRPC | Protocol Buffers are the standard approach. |
| gRPC-Web | Protocol Buffers in the usual binary configuration, with supported text mode as well. |
| Socket.IO | Uses its own packet format and a configurable parser; binary attachments are supported. |
| TSRPC | Provides its own serialization options, including binary-oriented formats. Exact configuration requires verification. |
| rpc-websockets | JSON-RPC-style messages over WebSocket. |
| Connect | Supports Protobuf and JSON in appropriate protocol configurations. |
| Effect RPC | Supports JSON-oriented protocols and SchemaBinary; exact configuration should be verified. |
| Metacom | Exact serialization format and customization points need verification. |

Shinka's architectural approach is to keep serialization separate from the transport. This makes it possible to introduce transformations such as binary encoding, compression, or other serialization layers without redesigning the application-level communication model.

The practical value of this separation depends on how easily a new serializer can be integrated and whether the chosen transport can accommodate its requirements.

## 7. Liveness detection

A live transport connection does not necessarily imply that the remote application is responsive. Liveness detection addresses how a system recognizes a dead or unresponsive peer.

| Implementation | Mechanism |
|---|---|
| Shinka RPC | Liveness monitoring is available through the LiMon component; exact timeout and threshold behavior should be documented alongside test results. |
| Comlink | No general network heartbeat is inherent in its RPC abstraction. |
| tRPC | Depends on the transport and application configuration; a universal heartbeat mechanism has not been established here. |
| JSON-RPC 2.0 | Not specified by the protocol. |
| gRPC | Supports keepalive mechanisms at the transport level. |
| gRPC-Web | Browser-side liveness behavior depends on the protocol and server infrastructure. |
| Socket.IO | Built-in heartbeat using ping/pong and timeout-based disconnection detection. |
| TSRPC | Exact built-in heartbeat behavior needs verification. |
| rpc-websockets | Exact heartbeat and timeout behavior needs verification. |
| Connect | Exact built-in liveness behavior depends on the protocol and configuration; more verification is needed. |
| Effect RPC | Depends on the transport and configuration; more verification is needed. |
| Metacom | Exact timeout and heartbeat behavior needs verification. |

For this comparison, three mechanisms should be distinguished:

1. Detecting an unresponsive peer.
2. Detecting a broken transport connection.
3. Re-establishing communication after a failure.

A framework that supports one does not necessarily provide the others.

## 8. Connection lifecycle

Connection lifecycle concerns how an implementation starts, stops, reconnects, and handles operations that are in progress during a failure.

Shinka exposes explicit lifecycle operations through its bus abstraction, including `start()`, `stop()`, and `restart()`. It also exposes connection-related events and request timeouts.

For other implementations, the following behavior still needs systematic verification:

- Is reconnect automatic or application-managed?
- What happens to outstanding requests when a connection is lost?
- Are pending messages buffered?
- Is application state restored after reconnection?
- Can a connection be restarted without reconstructing all application handlers?

Socket.IO provides automatic reconnection and buffering facilities. Other frameworks have different lifecycle models, and the exact behavior depends on the selected transport and configuration.

No complete, version-specific lifecycle matrix is available yet.

## 9. Communication model

RPC is often associated with request/response, but persistent application connections may also need events, notifications, and streaming.

| Implementation | Communication model |
|---|---|
| Shinka RPC | Request/response and one-way data events; both directions can participate in communication. |
| Comlink | Remote method calls over message passing. |
| tRPC | Typed procedures, queries, mutations, and subscriptions. |
| JSON-RPC 2.0 | Requests, responses, notifications, and batch requests as defined by the specification. |
| gRPC | Unary RPC and client-, server-, and bidirectional-streaming RPC. |
| Socket.IO | Bidirectional events, acknowledgements, rooms, and namespaces. |
| TSRPC | Typed request/response and push/event mechanisms; exact streaming capabilities need verification. |
| rpc-websockets | RPC calls and server-to-client events over WebSocket. |
| Connect | Unary and streaming RPC modes, depending on protocol and runtime support. |
| Effect RPC | Typed RPC with streaming-related capabilities; exact configuration needs verification. |
| Metacom | RPC and streaming capabilities are associated with the ecosystem; details need verification. |

Shinka's event model is important because it allows a connection to carry both request/response traffic and one-way application events. This should be compared against equivalent functionality in other libraries rather than treated as unique merely because the APIs differ.

## 10. Type safety and validation

Type safety and runtime validation solve different problems.

TypeScript types help developers catch mistakes at compile time, but they do not automatically validate data received from an untrusted remote peer.

- **Shinka RPC:** TypeScript-oriented API; the degree of end-to-end type safety depends on how application handlers and message types are defined. A general runtime validation layer has not been established in this comparison.
- **Comlink:** TypeScript types can describe remote interfaces, but they do not inherently validate messages at runtime.
- **tRPC:** End-to-end TypeScript inference is a central feature; runtime input validation can be integrated with schema libraries.
- **JSON-RPC 2.0:** Defines message structure, not TypeScript inference or application-level validation.
- **gRPC:** Protobuf schemas and generated code provide typed contracts and structured message decoding.
- **gRPC-Web:** Uses generated client contracts in typical configurations.
- **Socket.IO:** TypeScript event typing is available, but runtime validation is a separate concern.
- **TSRPC:** Strongly typed API definitions and runtime validation are central to its approach.
- **rpc-websockets:** Application-level TypeScript contracts and runtime validation depend on the surrounding code.
- **Connect:** Generated Protobuf schemas provide typed contracts; validation capabilities depend on the selected schema and implementation.
- **Effect RPC:** Uses Effect's schema and type system; exact validation behavior depends on the API configuration.
- **Metacom:** The available evidence is insufficient for a reliable assessment.

A more detailed comparison should evaluate the same failure case: a remote peer sends a structurally invalid request. Does the implementation reject it, report an error, or allow it to reach the application handler?

## 11. Concurrency and delivery

Concurrency and delivery semantics determine what happens when many operations are active simultaneously or the connection fails.

Shinka provides request correlation and timeout behavior. Its ecosystem also includes concurrency utilities, but those should be treated as separate packages rather than assumed to be part of the core bundle.

Other implementations expose different combinations of:

- Concurrent requests over one connection.
- Backpressure and buffering.
- Request cancellation.
- Retry behavior.
- Duplicate suppression.
- Ordering guarantees.
- Handling of outstanding requests after disconnection.

No complete cross-library test results are available yet. In particular, automatic reconnection must not be interpreted as guaranteed delivery: a request may have reached the server even if its response was lost.

A future benchmark should test these behaviors directly rather than infer them from API names.

## 12. Extensibility

Shinka separates its bus, transport, serializer, and optional protocol components. This creates explicit integration points for extending its behavior.

Other implementations have different extension mechanisms:

- Comlink allows custom endpoint arrangements and transfer handlers.
- tRPC supports links, adapters, and transformers.
- JSON-RPC 2.0 permits different transports and application-defined methods while keeping the message format standardized.
- gRPC and Connect support interceptors and middleware-like extension points.
- Socket.IO supports custom parsers and middleware.
- TSRPC and Effect RPC provide their own framework-specific extension mechanisms.
- The exact extension points of rpc-websockets and Metacom need further investigation.

The remaining question is how much code is required to add a feature without modifying the framework itself. A useful practical test would be implementing a custom serializer and transport for each library where the architecture permits it.

## 13. Dependencies and modularity

Bundle size is affected by more than the core package. Runtime dependencies, optional components, tree-shaking, and the application's chosen transport can substantially change the final result.

Shinka's package architecture allows additional functionality to be distributed separately. This is useful when an application needs only the core communication model, but the actual benefit should be measured with a minimal production build.

For the alternatives, complete dependency and tree-shaking measurements are not yet available. Bundlephobia figures should therefore be interpreted as package-level reference points, not as definitive measurements of a complete application.

## 14. Unique features

This section describes potential differentiators, not a claim that equivalent functionality is absent from every alternative.

### Shinka RPC

- A bus abstraction that separates connection management from transport and serialization.
- Explicit lifecycle operations, including restart.
- Bidirectional request/response and one-way events.
- Pluggable serializers and transports.
- Optional liveness monitoring.
- An exclusive channel lock for coordinating operations that must not interleave with outgoing writes.
- An ecosystem of additional packages for concurrency and higher-level communication patterns.

The exclusive lock is particularly worth investigating in more depth. It allows a section of outgoing communication to be reserved so that other messages are not written to the transport until the reservation is released. Buffered messages may still exist during the reservation; the guarantee concerns writes to the channel, not the absence of pending data.

### Other implementations

- **Comlink:** ergonomic remote method calls between JavaScript contexts.
- **tRPC:** end-to-end TypeScript inference for application APIs.
- **JSON-RPC 2.0:** a standardized, transport-independent message format.
- **gRPC:** cross-language RPC contracts and streaming based on Protobuf.
- **Socket.IO:** event-oriented communication, reconnection, buffering, rooms, and namespaces.
- **TSRPC:** typed RPC with runtime validation and binary-oriented serialization options.
- **rpc-websockets:** a familiar JSON-RPC programming model over persistent WebSocket connections.
- **Connect:** an HTTP-based RPC ecosystem designed to interoperate with gRPC-style services.
- **Effect RPC:** RPC integrated with the Effect ecosystem's abstractions.
- **Metacom:** RPC and streaming capabilities within the broader Metarhia ecosystem.

These descriptions should be expanded only where source code or official documentation confirms the relevant behavior.

## 15. Maturity and ecosystem

Maturity cannot be reduced to a package's popularity or its number of downloads. Relevant factors include release history, API stability, test coverage, documentation, issue response, ecosystem integration, and compatibility guarantees.

Shinka RPC is currently distributed under an alpha version (`0.1.0-alpha.12` in this comparison). This should be disclosed prominently because users may reasonably expect more API changes than they would from a mature, stable release.

A complete maturity comparison has not yet been conducted for the alternatives. No unsupported ranking is provided here.

## 16. Network overhead

Network overhead is the amount of serialized protocol data required beyond the application's useful payload.

For a fair comparison, this article defines the useful payload as the application-level key/value pair. For example, an event uses the key `event` and the value `hello`.

The measured message size should be divided into:

- **Useful payload:** the application data in the agreed representation.
- **Protocol overhead:** message type, request identifier, framing, separators, and other protocol-specific information.
- **Total serialized size:** useful payload plus protocol overhead.

The following initial results are available for Shinka's JSON serializer:

| Message | Reported protocol overhead | Notes |
|---|---:|---|
| Event | 9 bytes | Based on the current test cases |
| Request | At least 11 bytes | Includes a request identifier |
| Success response | 6 bytes | Includes a response identifier |
| Error response | 6 bytes | Includes a response identifier |

These figures are preliminary and depend on the exact test messages and counter values. The request/response counter grows over time, so the serialized identifier length must be accounted for separately.

For Socket.IO, a test-based observation suggests 5 bytes of protocol overhead for the example packet `42["hello","world"]`, when the two quoted strings are counted as the useful payload. This figure should be reproduced against the exact package version and test case before being treated as a final benchmark.

For the other implementations, comparable measurements have not yet been collected.

### Measurement status

To avoid false precision, each result should eventually have one of these labels:

- **Measured:** captured from the specified implementation and version.
- **Derived from protocol:** calculated from a documented wire format.
- **Not comparable:** no equivalent message or a different serialization model prevents a fair comparison.
- **Unknown:** insufficient information.

For JSON-RPC, Connect, gRPC, and other structured protocols, test messages must be equivalent at the application level. Binary Protobuf messages cannot be fairly compared with JSON messages by simply counting their framing bytes.

Transport-level overhead such as TCP, TLS, HTTP, and WebSocket framing should be measured separately from the serialized RPC message.

## 17. Summary

The current evidence suggests that Shinka RPC has a competitive package size and a modular architecture that makes transport and serialization choices explicit.

However, the available data is not sufficient to establish an overall winner. Several comparisons still require equivalent configurations, particularly for runtime support, lifecycle behavior, concurrency, and network overhead.

The most valuable next steps are:

1. Establish a reproducible minimum-bundle benchmark for each browser-compatible implementation.
2. Verify browser, Node.js, and Bun compatibility with explicit runtime tests.
3. Measure request, response, success, error, and event message sizes using equivalent payloads.
4. Document connection lifecycle and liveness behavior with tests.
5. Compare which features are built in, provided by optional packages, or left to application code.

The goal is not to prove that Shinka RPC is superior in every category. It is to determine where its architecture provides practical advantages, where other solutions are a better fit, and which improvements would make Shinka more useful to developers.
