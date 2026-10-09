# [Dedicated Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) Transport

::: tip Use `Client`
On
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) side
:::

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
import { dedicatedWorkerClient } from "@shinka-rpc/dedicated-worker";

const transport = dedicatedWorkerClient(
  () => new Worker(new URL("../worker", import.meta.url)),
);

const bus = new Client({ transport, serializer, outscope });
```
:::

::: details Worker
```typescript
import { Client } from "@shinka-rpc/core";
import { dedicatedWorkerServer } from "@shinka-rpc/dedicated-worker";

export const worker = new Client({
  transport: dedicatedWorkerServer,
  serializer,
  outscope,
});
```
:::
