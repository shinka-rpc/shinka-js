# @shinka-rpc/core

Symmetric RPC bus. This page explains basic concepts only.
[Documentation is here](https://shinka-rpc-js.readthedocs.io/latest/core/)

![diagram](https://raw.githubusercontent.com/shinka-rpc/shinka-js/66e1552e57d63c30b2122387f06c4bb354c7e87f/docs/img/shinka-structure.svg "How `@shinka-rpc` works")

This package implements the main functionality of `@shinka-rpc`. Ironically the
`core` know how to do everything but it is made so abstract that as is unable to
do anything. So to make `@shinka-rpc` be able to do things, you have to pass the
**transport** -- commonly very small function, returning 2 functions: `send` and
`close`, and subscribing the `bus` instance to `onMessage`. Here you are able to
implement the custom one (or more) or use any already existing:

- [@shinka-rpc/browser-extension](https://www.npmjs.com/package/@shinka-rpc/browser-extension)
implements the RPC bus between the page and browser extension environment

- [@shinka-rpc/dedicated-worker](https://www.npmjs.com/package/@shinka-rpc/dedicated-worker)
implements the RPC bus between the page and
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker)

- [@shinka-rpc/shared-worker](https://www.npmjs.com/package/@shinka-rpc/shared-worker)
implements the RPC bus between the page and
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

- [@shinka-rpc/web-socket](https://www.npmjs.com/package/@shinka-rpc/web-socket)
implements the RPC bus over the
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

Also there are some default serializers available:

- [@shinka-rpc/serializer-json](https://www.npmjs.com/package/@shinka-rpc/serializer-json)

- [@shinka-rpc/serializer-bson](https://www.npmjs.com/package/@shinka-rpc/serializer-bson)

- [@shinka-rpc/serializer-msgspec](https://www.npmjs.com/package/@shinka-rpc/serializer-msgspec)

- [@shinka-rpc/serializer-gzip](https://www.npmjs.com/package/@shinka-rpc/serializer-gzip)

- [@shinka-rpc/serializer-base64](https://www.npmjs.com/package/@shinka-rpc/serializer-base64)

The main advantage of `@shinka-rpc` is in re-using of the same `core` with all
transports. And when you decided to build many RPC communication buses, your
bundle would contain only one `core`

# Symmetricity

It means **both** server and client may register **request** and **event**
handlers, and then send *requests* and *events* to each other, and **both** may
initialize connections

# `request` and `dataEvent`

Scopes are **separated**. The difference is that `request` **requires** for the
response and **waits** for it, and the `dataEvent` does not support response and
does not wait for any feedback from other side -- shoot and forget

# Usage

There are 3 main scenarios: `client`, `server` and `pool` usage. `Hybrid`
scenario is also supported (both `server` and `pool` use `Hub` instance under
the hood), but I'm not sure you'll actually use it :)
There are some strange cases: dedicated
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) or
[iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).
Who is a server and client if each of them are alone? It's one-to-one relation,
so answer is both of them are `client`s, it's OK to make RPC bus for
`client`-`client` case

The first thing what we have to do is a bus initialization. I'll use as an
example `@shinka-rpc/shared-worker` package

## `client` initialization

```typescript
import { Client } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { sharedWorkerClient } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-msgspec";

const transport = sharedWorkerClient(
  () => new SharedWorker(new URL("./worker.ts", import.meta.url)),
);

export const client = new Client({ outscope, transport, serializer });

client.addEventListener("error", console.error);

client.start();
```

## `server` initialization

```typescript
import { Server } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { sharedWorkerServer } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-msgspec";

const server = new Server({
  outscope,
  transport: sharedWorkerServer,
  serializer,
});

server.addEventListener("error", console.error);

server.start();
```

## Register `dataEvent` and `request` handlers

Both `client`, `server` and `pool` provide the same API:

- **1-st** handler arg: `any` payload. Use `Object` and `Array` to pass multiple
args, and then unpack them

- **2nd** handler arg: `thisArg`
  - In `client` case it's `Client` itself
  - In `server` and `pool` cases it's `Bus` -- `client` connection
    representation

```typescript
let token: string | null = null;

server.onRequest("some-endpoint", async () => {
  if (token === null) throw new Error('Token is not available');
  const options: RequestInit = {
    cache: "no-store",
    headers: { Authorization: token },
  };
  const response = await fetch("/api/some/endpoint", options);
  return await response.json();
});

server.onDataEvent("set-token", ([newToken]: [string]) => {
  token = newToken;
});
```

**IMPORTANT**: `request` handler can **NOT** return
[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
If you need to something `async`hronous, just use `async` function as a handler

## Call registered `dataEvent` and `request` handlers

Both `server` and `client` provide the same API:

```typescript
import type { IBus } from "@shinka-rpc/core";

const someEndpoint = (bus: IBus<any, any>) =>
  bus.request<SomeData>("some-endpoint");  // returns Promise<SomeData>
const setToken = (bus: IBus<any, any>, token: string) =>
  bus.dataEvent("set-token", [token]);
```
