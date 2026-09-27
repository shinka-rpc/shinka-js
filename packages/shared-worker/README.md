# @shinka-rpc/shared-worker

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/latest/transports/shared-worker/)

This package implements the transport implementation of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

# Usage

## `client` / `page` case

```typescript
import { Client } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { sharedWorkerClient } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-json";

const transport = sharedWorkerClient(
  () => new SharedWorker(new URL("../server", import.meta.url)),
);

export const client = new Client({ transport, serializer, outscope });
```

## `server` / `worker` case

```typescript
import { Server } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { sharedWorkerServer } from "@shinka-rpc/shared-worker";
import serializer from "@shinka-rpc/serializer-json";

const server = new Server({
  transport: sharedWorkerServer,
  serializer,
  outscope,
});
```
