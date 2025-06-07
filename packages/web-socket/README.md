# @shinka-rpc/web-socket

Symmetric RPC bus

This package contains a parametrizers of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

# Usage

## `client` case

```typescript
import { ClientBus, type FactoryClient } from "@shinka-rpc/core";
import { WebSocketFactoryData } from "@shinka-rpc/web-socket";
import serializer from "@shinka-rpc/serializer-json";  // for example

const factory: FactoryClient<ClientBus> = (bus) => {
  const socket = new WebSocket(process.env.WEBSOCKET_URL!);
  // Here you are able to do everything with `socket`. For example,
  // switch it to binary mode
  return WebSocketFactoryData(socket, bus);
};

export const bus = new ClientBus({ factory, serializer });

// You are able to start / stop the bus where you need it
bus.start();
```

**API Reference**: WebSocketFactoryData

- **Required** instance: `WebSocket`
- **Required** bus: `ClientBus`
