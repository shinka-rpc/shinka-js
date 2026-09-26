# @shinka-rpc/dedicated-worker [not tested!]

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/latest/transports/dedicated-worker/)

This package implements the transport implementation of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker)

# Usage

## `client` / `page` case

```typescript
import { Client } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { dedicatedWorkerClient } from "@shinka-rpc/dedicated-worker";
import serializer from "@shinka-rpc/serializer-json";

const transport = dedicatedWorkerClient(
  () => new Worker(new URL("../worker", import.meta.url)),
);

const bus = new Client({ transport, serializer, outscope });
```

## `worker` side

**IMPORTANT**: on
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) side you have
to use `Client`

```typescript
import { Client } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { dedicatedWorkerServer } from "@shinka-rpc/dedicated-worker";
import serializer from "@shinka-rpc/serializer-json"; 

export const worker = new Client({
  transport: dedicatedWorkerServer,
  serializer,
  outscope,
});
```
