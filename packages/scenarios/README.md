# @shinka-rpc/scenarios

![minzip](https://badgen.net/bundlejs/minzip/@shinka-rpc%2Fscenarios)
[![install size](https://packagephobia.com/badge?p=@shinka-rpc/scenarios@alpha)](https://packagephobia.com/result?p=@shinka-rpc/scenarios@alpha)

Reusable helpers for common communication and synchronization patterns built
around Shinka RPC.

See the [scenario documentation](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/scenarios/)
for details and examples.

## Install

```bash
npm install @shinka-rpc/scenarios
```

## Included scenarios

The package includes scenarios for waiting until a connection is ready, managing
a registry of clients, forwarding Shinka events and requests, and coordinating
asynchronous resource acquisition.

- **`readinessBarrier`** creates a reusable asynchronous barrier that represents
  the readiness of an `IBus`.
- **`createSingleFlight(options)`** — coalesces concurrent resource
  acquisitions by identity key and coordinates invalidation.
- **Client registry and pass-through scenarios** — provide additional
  Shinka-RPC-specific compositions for managing and forwarding client
  behavior.
- **`passThroughEvent`**, **`passThroughEvents`**, **`passThroughRequest`**, and
**`passThroughRequests`** forward selected operations between Shinka endpoints.
- **`reconnect`** helper automatically attempts to restart a `Bus` after it
  disconnects.

## Example

```ts
import { readinessBarrier } from "@shinka-rpc/scenarios";

const ready = readinessBarrier(client, async () => {
  await authenticate(client);
});

await ready;

const data = await client.request("get-data");
```
