# @shinka-rpc/concurrency

Symmetric RPC bus

This package implements synchronization primitives

## ReusablePromise

Initially it was typescript port of
[python's asyncio.Event](https://docs.python.org/3/library/asyncio-sync.html#asyncio.Event).
But there are some difference:

- Name. In javascript [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) is already exists
- Payload. It's possible to pass it in javascript. Why not to do it?
- Rejectable. Why not?
- Awaitable / PromiseLike as is, `.wait()` is not needed

So, it still may be used as synchronization primitive

Usage example:

```typescript
import { ReusablePromise } from "@shinka-rpc/util";

const voidRP = new ReusablePromise<void>();
await voidRP;  // waits until `signal.set()` is called

// ===

const numRP = new ReusablePromise<Number>();
console.log(numRP.isDone);  // false

// resolve branch ===

numRP.resolve(123);  // of course this would be called in different app part
console.log(numRP.isDone);  // true

const value1 = await numRP;  // value will be 123
const value2 = await numRP;  // value will be 123 again

numRP.reset();  // numSignal resets into initial empty state
console.log(numRP.isDone);  // false

// reject branch ===

numRP.reject(321);
console.log(numRP.isDone);  // true

try {
  await numRP;
} catch (e) {
  // e will be 321
}
```
