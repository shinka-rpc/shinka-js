# @shinka-rpc/shared-worker

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/latest/transports/shared-worker/)

This package implements the transport implementation of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

# Usage

## `client` case

```typescript
import { Client, TransportFactory } from "@shinka-rpc/core";
import { SharedWorker2Transport } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-json";  // for example

const transport: TransportFactory<Client> = async (bus) =>
  SharedWorker2Transport(
    new SharedWorker(new URL("./worker.ts", import.meta.url)),
    bus,
  );

export const bus = new Client({ factory, serializer });

bus.start();
```

### API Reference:

**SharedWorker2Transport**:

- **Required** instance: [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

- **Required** bus: `Client`

- **Optional** `binary`: `Boolean` &mdash; enable binary-specific `transfer` optimization. **Default**: `false`

- **Refurning**: `Transport`

## `server` case / `worker` side

First of all: please read the docs about
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)
API. There is no magic.

```typescript
// @ts-nocheck
declare let onconnect: (event: MessageDataEvent) => void;

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

- **Refurning**: `(e: MessageDataEvent) => void`
