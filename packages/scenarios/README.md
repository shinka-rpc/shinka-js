# @shinka-rpc/scenarios

Reusable helpers for common communication and synchronization patterns built
around Shinka RPC.

See the [scenario documentation](https://shinka-rpc-js.readthedocs.io/0.1.x/scenarios)
for details and examples.

## Install

```bash
npm install @shinka-rpc/scenarios
```

## Included scenarios

The package includes scenarios for waiting until a connection is ready, managing
a registry of clients, forwarding Shinka events and requests, and coordinating
asynchronous resource acquisition.

- **`waitConnected(bus)`** — returns a reusable promise that resolves on
  `connect` and becomes pending again on `disconnect`.
- **`createSingleFlight(options)`** — coalesces concurrent resource
  acquisitions by identity key and coordinates invalidation.
- **Client registry and pass-through scenarios** — provide additional
  Shinka-RPC-specific compositions for managing and forwarding client
  behavior.
- **`passThroughEvent`**, **`passThroughEvents`**, **`passThroughRequest`**, and
**`passThroughRequests`** forward selected operations between Shinka endpoints.

## Example

```ts
import { waitConnected } from "@shinka-rpc/scenarios";

const connected = waitConnected(bus);

await connected;
await bus.request("some-request");
```
