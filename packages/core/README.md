# @shinka-rpc/core

Symmetric RPC bus. This page explains basic concepts only.
[Documentation is here](https://example.com)

This package implements the main functionality of `@shinka-rpc`. Ironically the
`core` know how to do everything but made so abstract that as is unable to do
anything. So to make `@shinka-rpc` able to do things, you have to pass the
**transport** -- commonly very small function, returning 2 functions: `send` and
`close`, and subscribing the `bus` instance to `onMessage`. Here you are able to
implement the custom one (or more) or use any already existing:

- [@shinka-rpc/browser-extension](https://www.npmjs.com/package/@shinka-rpc/browser-extension) implements the RPC bus between the page and browser
extension environment

- TODO: [@shinka-rpc/iframe](https://www.npmjs.com/package/@shinka-rpc/iframe) implements the RPC bus between the main page and the page inside
[iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)

- TODO: [@shinka-rpc/dedicated-worker](https://www.npmjs.com/package/@shinka-rpc/dedicated-worker) implements the RPC bus between the page and
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker)

- [@shinka-rpc/shared-worker](https://www.npmjs.com/package/@shinka-rpc/shared-worker) implements the RPC bus between the page and
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

- [@shinka-rpc/web-socket](https://www.npmjs.com/package/@shinka-rpc/web-socket) implements the RPC bus over the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

- TODO: [@shinka-rpc/webrtc-data](https://www.npmjs.com/package/@shinka-rpc/webrtc) implements the RPC bus over the [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel)


The main advantage of `@shinka-rpc` is in re-using of the same `core` with all
parametrizers. And when you decided to build many RPC communication buses, your
bundle would contain only one `core`

# Symmetricity

It means **both** server and client may register **request** and **event**
handlers, and then send *requests* and *events* to each other

# `request` and `event`

Scopes are **separated**. The difference is that `request` **requires** for the
response and **waits** for it, and the `event` does not support response and
does not wait for any feedback from other side -- shoot and forget

# Usage

There are 2 scenarios: `server` and `client` usage. The only difference is
`server` accepts N `client`s. There are some strange cases: dedicated
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) or
[iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).
Who is a server and client if each of them are alone? Simple answer -- both of
them are `client`s, it's OK to make RPC bus for `client`-`client` case

The first thing what we have to do is a bus initialization. I'll use as an
example `@shinka-rpc/shared-worker` package

## `client` initialization

```typescript
import { ClientBus, FactoryClient } from "@shinka-rpc/core";
import { SharedWorker2FactoryData } from "@shinka-rpc/shared-worker/client";

const factory: FactoryClient<ClientBus> = async (bus) =>
  SharedWorker2FactoryData(
    new SharedWorker(new URL("./worker.ts", import.meta.url)),
    bus,
  );

export const bus = new ClientBus({ factory });

bus.start();
```

## `server` initialization

```typescript
// @ts-nocheck
declare let onconnect: (event: MessageEvent) => void;

import { ServerBus } from "@shinka-rpc/core";
import { SharedWorkerServer } from "@shinka-rpc/shared-worker/server";

export const server = new ServerBus();

onconnect = SharedWorkerServer(server);
```

## Register `event` and `request` handlers

Both `server` and `client` provide the same API:

- **1-st** handler arg: `any` payload. Use `Object` and `Array` to pass multiple
args, and then unpack them

- **2nd** handler arg: `thisArg`
  - In `client` case it's `ClientBus` itself
  - In `server` case it's `CommonBus` -- `client`'s representation

```typescript
server.onRequest("load-meta", async () => {
  const response = await fetch("/meta.json", { cache: "no-store" });
  return await response.json();
});

let token: string | null = null;

server.onDataEvent("set-token", ([newToken]: [string]) => {
  token = newToken;
});
```

**IMPORTANT**: `request` handler can **NOT** return
[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
If you need to something `async`ronous, just use `async` function as a handler

## Call registered `event` and `request` handlers

Both `server` and `client` provide the same API:

```typescript
type Meta = {};
const loadMeta = () => bus.request<Meta>("load-meta");  // returns Promise<Meta>
const setToken = (token: string) => bus.event("set-token", [token]);
```
