# @shinka-rpc/web-socket

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/transports/web-socket.html)

This package implements the transport implementation of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

# Usage

## `client` case

```typescript
import { Client } from "@shinka-rpc/core";
import { clientWebSocketTransport } from "@shinka-rpc/web-socket";

const transport = clientWebSocketTransport(
  () => new WebSocket(process.env.WEBSOCKET_URL!),
);

const bus = new Client({ factory, serializer, outscope });
```

## `server` case

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
