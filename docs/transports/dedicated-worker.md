# [Dedicated Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) Transport

::: tip IMPORTANT
On
[Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) side you have
to use `Client`
:::

::: details Client / Page
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
:::

::: details Worker
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
:::
