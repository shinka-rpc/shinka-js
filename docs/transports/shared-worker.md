# Shared Worker Transport

::: details Client / Page
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
:::

::: details Server / Worker
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
:::
