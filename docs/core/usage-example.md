# Usage Example

- `request` handler **requires** the response. Good analogy is
[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

- `event` handler **ignores** the response. Good analogy is
[Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)

Here is the most canonical usage example:

```typescript
import { ClientBus, FactoryClient } from "@shinka-rpc/core";
import { SharedWorker2FactoryData } from "@shinka-rpc/shared-worker/client";
import serializer from "@shinka-rpc/serializer-json";  // for example


const factory: FactoryClient<ClientBus> = async (bus) =>
  SharedWorker2FactoryData(
    new SharedWorker(new URL("./worker.ts", import.meta.url)),
    bus,
  );

export const bus = new ClientBus({ factory, serializer });

bus.start();

// Here we register request and event handlers
// They can be called by interlocutor side
// Both client and server may call API each other

let token: string | null = null;

bus.onRequest("request-async", async () => {
  const response = await fetch(/*...*/);
  return await response.json();
});

bus.onRequest("get-token", () => {
  return token
});

// event handlers may be both syncronous and asyncronous
bus.onDataEvent("set-token", ([newToken]: [string]) => {
  token = newToken;
});

// Here we wrap `request` method. Both `request` and `event` accept only one
// argument. To make them able to accept any number of args you have to pack
// argsuments into `Array` or `Object` -- as you prefer.
// Generally `Array` is more compact after serializing
export const doStuff = (
  stuff: string,
  when: Date,
  opts: Record<string, unknown>,
) =>
  bus.request<string>("do-stuff", [
    stuff,
    when,
    opts,
  ]);
```
