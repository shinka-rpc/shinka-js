# @shinka-rpc/banshee

Symmetric RPC bus

## banshee

[Banshee in irish mythology](https://en.wikipedia.org/wiki/Banshee) doesn't
kill, but she comes to people who will die soon. The object may die because of
different reasons:
  * The browser page has been closed: page and DedicatedWorker
  * All browser pages have been closed: SharedWorker and ServiceWorker
  * GC decided to remove the object due there are no alive references
  * NodeJS server is going to shutdown

```typescript
import { banshee } from "@shinka-rpc/util";

const onWail = () => console.log("I hear banshee wail. It looks I'll die soon");
const target = {};
const die: (callOnWail?: boolean | undefined) => void = banshee(target, onWail);
```

Banshee guarantee that `onWail` function will be called exactly once. If `die`
function is called, all event listeners are removed

**API Reference**:

- **Required** `target`: `any` non-primitive GC-collectable object
- **Required** `onWail`: `() => void` function to finalize `target`

**Returns**: `(callOnWail = true) => void` function. This function calls `onWail`
if `callOnWail` (by default is `true`) and removes registered eventListeners
