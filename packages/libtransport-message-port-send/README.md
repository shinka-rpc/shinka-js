# @shinka-rpc/libtransport-message-port-send

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/latest/)

Transport utility package implements `postMessage` wrapper with `transferable`:

```typescript
import type { SerializationMode } from "@shinka-rpc/core";

export interface HasPostMessage {
  postMessage(message: any, transfer: Transferable[]): void;
  postMessage(message: any, options?: StructuredSerializeOptions): void;
}

export default {
  text: (port) => (raw: string) => port.postMessage(raw),
  binary: (port) => (raw: Uint8Array) => port.postMessage(raw, [raw.buffer]),
} as Record<SerializationMode, (port: HasPostMessage) => (raw: any) => void>;
```
