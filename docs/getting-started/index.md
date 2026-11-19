# Getting Started

This section introduces the concepts and components needed to start building applications with Shinka-RPC.

## 1. Introduction

- [What is RPC?](./what-is-rpc.md) — An introduction to Remote Procedure Calls and the problems they solve.
- [Comparing RPC Solutions](./compare-rpc-solutions.md) — How Shinka-RPC compares to other RPC libraries and communication solutions.

## 2. [Choosing a Component](./choosing-a-component)

Learn which high-level component best fits your application:

- **Client** — for establishing a single peer-to-peer connection.
- **Server** — for accepting and managing incoming connections.
- **Pool** — for managing a collection of connections.

## 3. [Scenarios](../api-reference/scenarios/)

Explore practical use cases and discover how Shinka-RPC components and utilities can be combined to solve different communication tasks.

## 4. Understanding [Outscope](../api-reference/outscope)

[Outscope](../api-reference/outscope) is a fundamental concept in Shinka-RPC. It provides the integration point between the library and its execution environment through dependency injection.

Understanding [Outscope](../api-reference/outscope) is essential before working with Shinka-RPC components.

## 5. [Transports](../api-reference/transports/)

Learn about the available [transports](../api-reference/transports/) and the communication environments and use cases they support.

## 6. [Liveness Monitors](../api-reference/limons/)

Learn how [Liveness Monitors](../api-reference/limons/) help detect unresponsive peers and monitor connection health.

## 7. [Serializers](../api-reference/serializers/)

Understand how Shinka-RPC represents and serializes messages exchanged between peers.

## [Building Blocks](./building-blocks.md)

A collection of general-purpose primitives and utilities used to build Shinka-RPC Core. These tools are independent of the RPC layer and can be used in any application.
