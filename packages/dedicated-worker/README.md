# @shinka-rpc/dedicated-worker [not tested!]

Symmetric RPC bus

This package implements the transport implementation of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker)

# Usage

## `client` case

```typescript
import { ClientBus, FactoryClient } from "@shinka-rpc/core";
import { DedicatedWorker2FactoryData } from "@shinka-rpc/dedicated-worker";

const factory: FactoryClient<ClientBus> = async (bus) =>
  DedicatedWorker2FactoryData(
    new Worker(new URL("./worker.ts", import.meta.url)),
    bus,
  );

export const bus = new ClientBus({ factory });

bus.start();
```

## `worker` side

**IMPORTANT**: on
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) side you have
to use `ClientBus`

```typescript
// @ts-nocheck
declare let onmessage: (event: MessageEvent) => void;

import { ClientBus } from "@shinka-rpc/core";
import {
  DedicatedWorkerServer,
  createOnMessage,
} from "@shinka-rpc/dedicated-worker";
import serializer from "@shinka-rpc/serializer-json";  // for example

export const server = new ClientBus({
  factory: DedicatedWorkerServer,
  serializer,
});

onmessage = createOnMessage(server);
```
