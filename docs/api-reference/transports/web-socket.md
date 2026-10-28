# WebSocket Transport

::: tip Serialization: REQUIRED
:::


::: details Client / Page
```typescript
import { Client } from "@shinka-rpc/core";
import { clientWebSocketTransport } from "@shinka-rpc/web-socket";

const transport = clientWebSocketTransport(
  () => new WebSocket(process.env.WEBSOCKET_URL!),
);

const bus = new Client({ factory, serializer, outscope });
```
:::

::: details Server / Worker
```typescript
import express from "express";
import http from "node:http";
import { WebSocketServer } from "ws";

import { Server } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/node-process";
import { webSocketServer } from "@shinka-rpc/web-socket";

const app = express();
const port = 8081; // The port your express server will be running on.

const httpServer = http.createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

const server = new Server({
  outscope,
  transport: webSocketServer(wss),
  serializer,
});
```
:::
