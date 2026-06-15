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

// event handlers may be both syncronous and asyncronous
server.onDataEvent(
  "set-token",
  ([newToken, sayUpdated]: [string, bool], bus) => {
    if (token === newToken) return;
    token = newToken;
    tokenLastUpdated = new Date();
    if (sayUpdated) notifyUpdated(bus);
  }
);

// Here we wrap `request` method. Both `request` and `event` accept only one
// argument. To make them able to accept any number of args you have to pack
// argsuments into `Array` or `Object` -- as you prefer.
// Generally `Array` is more compact after serializing
const notifyUpdated = (bus: Bus) =>
  bus.request<string>("notify-updated", [tokenLastUpdated, bus.extra.id]);
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
```
:::
