# @shinka-rpc/util

Symmetric RPC bus

This package implements auxiliary utilities

## sequence

Simple factory function, returning database-like sequence -- the function
returning auto-incrementing value

```typescript
import { sequence } from "@shinka-rpc/util/sequence";

const fromZero = sequence();
const fromFive = sequence(5);

// [fromZero(), fromZero(), fromZero()] === [0, 1, 2]
// [fromFive(), fromFive(), fromFive()] === [5, 6, 7]
```

**API Reference**:

- **Optional** initialValue: `Number`

## sleep

Simple wrapper over `setTimeout` and `Promise`

```typescript
import { sleep } from "@shinka-rpc/util/sleep";

await sleep(250);
```

**API Reference**:

- **Required** time: `Number` of milliseconds, passed directly to `setTimeout`
