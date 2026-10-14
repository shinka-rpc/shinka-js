# Shared Worker Transport

::: tip Serialization: REQUIRED
:::

::: tip You have to check docs of your bundler:
- [rsbuild](https://rsbuild.rs/guide/basic/web-workers)
- [vite](https://vite.dev/guide/features#web-workers)
- [bun](https://bun.com/docs/runtime/workers#creating-a-worker)
- 💩 [turbopack](https://github.com/vercel/turborepo/issues/3643)
:::

::: details Client / Page
```typescript
import { Client } from "@shinka-rpc/core";
import { sharedWorkerClient } from "@shinka-rpc/shared-worker";

const transport = sharedWorkerClient(
  () => new SharedWorker(new URL("../server", import.meta.url)),
);

export const client = new Client({ transport, serializer, outscope });
```
:::

::: details Server / Worker
```typescript
import { Server } from "@shinka-rpc/core";
import { sharedWorkerServer } from "@shinka-rpc/shared-worker";

const server = new Server({
  transport: sharedWorkerServer,
  serializer,
  outscope,
});
```
:::
