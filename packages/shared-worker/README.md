# @shinka-rpc/shared-worker

Symmetric RPC bus

This package contains a parametrizers of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

# Usage

## `client` case

```typescript
import { ClientBus, FactoryClient } from "@shinka-rpc/core";
import { SharedWorker2FactoryData } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-json";  // for example

const factory: FactoryClient<ClientBus> = async (bus) =>
  SharedWorker2FactoryData(
    new SharedWorker(new URL("./worker.ts", import.meta.url)),
    bus,
  );

export const bus = new ClientBus({ factory, serializer });

bus.start();
```

### API Reference:

**SharedWorker2FactoryData**:

- **Required** instance: [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

- **Required** bus: `ClientBus`

- **Optional** `binary`: `Boolean` &mdash; enable binary-specific `transfer` optimization. **Default**: `false`

- **Refurning**: `FactoryData`

## `server` case

First of all: please read the docs about
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)
API. There is no magic.

```typescript
// @ts-nocheck
declare let onconnect: (event: MessageEvent) => void;

import { ServerBus } from "@shinka-rpc/core";
import { SharedWorkerServer } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-json";  // for example

export const server = new ServerBus({ serializer });

onconnect = SharedWorkerServer(server);
```

### API Reference:

**SharedWorkerServer**:

- **Reqiored** server: `ServerBus`

- **Optional** `binary`: `Boolean` &mdash; enable binary-specific `transfer` optimization. **Default**: `false`

- **Refurning**: `(e: MessageEvent) => void`
