# Usage Example

Let's create a `SharedWorker`!

::: details Server
```typescript
import { Server, type Bus } from "@shinka-rpc/core";
import { sharedWorkerServer } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-json";

import { sequence } from "@shinka-rpc/util";

const server = new Server({ transport: sharedWorkerServer, serializer });

server.addEventListener("error", console.error);

const seq = sequence();

server.addEventListener("connect", (bus) => {
  bus.extra.id = seq();
  console.log(`connected: ${bus.extra.id}`);
});

server.addEventListener("disconnect", (bus) => {
  console.log(`disconnected: ${bus.extra.id}`);
});

server.start();  // < === By default the bus is not started!

// Here we register request and dataEvent handlers
// They can be called by interlocutor side
// Both client and server may call API each other

let token: string | null = null;
let tokenLastUpdated = new Date();

server.onRequest("request-async", async () => {
  const response = await fetch(/*...*/);
  return await response.json();
});

server.onRequest("get-token", () => token);

// event handlers may be both synchronous and asynchronous
server.onDataEvent(
  "set-token",
  ([newToken, sayUpdated]: [string, bool], bus) => {
    if (token === newToken) return;
    token = newToken;
    tokenLastUpdated = new Date();
    if (sayUpdated) notifyUpdated(bus);
  }
);

// Here we wrap `request` method. Both `request` and `dataEvent` accept only one
// argument. To make them able to accept any number of args you have to pack
// arguments into `Array` or `Object` -- as you prefer.
// Generally `Array` is more compact after serializing
const notifyUpdated = (bus: Bus) =>
  bus.dataEvent("notify-updated", [tokenLastUpdated, bus.extra.id]);

const getStuff = (bus: Bus) =>
  bus.request<string>("get-stuff", null);
```
:::

::: details Client
```typescript
import { Client } from "@shinka-rpc/core";
import { sharedWorkerClient } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-msgspec";

const transport = sharedWorkerClient(
  () => new SharedWorker(new URL("./server", import.meta.url)),
);

const client = new Client({ transport, serializer });

client.addEventListener("error", console.error);

client.start();

// Request and event handlers may called by server

client.onDataEvent(
  "notify-updated",
  ([tokenLastUpdated, busId]: [Date, Number]) => {
    console.log({tokenLastUpdated, busId})
  },
)

client.onRequest("get-stuff", () => Math.random().toString().slice(2));
```
:::

Also please check demo app [[front](https://github.com/shinka-rpc/demo-js-front), [back](https://github.com/shinka-rpc/demo-js-back)]:
1) [Front-end: React integration](https://github.com/shinka-rpc/demo-js-front/blob/73b5d01ae6ea2566037b2a8a28caf6175b751fef/src/app.tsx#L47-L71)
2) [Front-end: Shared Worker](https://github.com/shinka-rpc/demo-js-front/blob/main/src/shared-worker.ts)
3) [Back-end](https://github.com/shinka-rpc/demo-js-back/blob/1e3cde235d2e7db29f3c90f6e7f84ab1d3e2a532/src/index.ts#L35-L55)
