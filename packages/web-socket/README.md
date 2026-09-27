# @shinka-rpc/web-socket

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/latest/transports/web-socket/)

This package implements the transport implementation of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

# Usage

## `client` case

```typescript
import { Client } from "@shinka-rpc/core";
import outscope from "@shinka-rpc/outscope/browser-page";
import { clientWebSocketTransport } from "@shinka-rpc/web-socket";
import serializer from "@shinka-rpc/serializer-json";  // for example

const transport = clientWebSocketTransport(
  () => new WebSocket(process.env.WEBSOCKET_URL!),
);

export const bus = new Client({ factory, serializer, outscope });

// You are able to start / stop the bus where you need it
bus.start();
```
