# @shinka-rpc/shared-worker

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/transports/shared-worker.html)

This package implements the transport implementation of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)

# Usage

## `client` / `page` case

```typescript
import { Client } from "@shinka-rpc/core";
import { sharedWorkerClient } from "@shinka-rpc/shared-worker";

const transport = sharedWorkerClient(
  () => new SharedWorker(new URL("../server", import.meta.url)),
);

export const client = new Client({ transport, serializer, outscope });
```

## `server` / `worker` case

```typescript
import { Server } from "@shinka-rpc/core";
import { sharedWorkerServer } from "@shinka-rpc/shared-worker";

const server = new Server({
  transport: sharedWorkerServer,
  serializer,
  outscope,
});
```

## Important

You have to check details of your bundler:
- [rsbuild](https://rsbuild.rs/guide/basic/web-workers)
- [vite](https://vite.dev/guide/features#web-workers)
- [bun](https://bun.com/docs/runtime/workers#creating-a-worker)
- 💩 [turbopack](https://github.com/vercel/turborepo/issues/3643)
