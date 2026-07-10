# @shinka-rpc/util

Symmetric RPC bus

This package implements auxiliary utilities

## sequence

Simple factory function, returning database-like sequence -- the function
returning auto-incrementing value

```typescript
import { sequence } from "@shinka-rpc/util";

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
import { sleep } from "@shinka-rpc/util";

await sleep(250);
```

**API Reference**:

- **Required** time: `Number` of milliseconds, passed directly to `setTimeout`

## delegate

Implements [delegate](https://en.wikipedia.org/wiki/Delegation_pattern) pattern
in `forwardRef` manner to make possible late binding to resolve circular
dependency problem

```typescript
import { delegate } from "@shinka-rpc/util";

const defaultFn = () => console.error("Implementation is not ready!");
const {call, set, reset} = delegate<(a1: any, a2: any /*, ...*/) => any>(defaultFn);
const dependency1 = new Dependency1(call);
const dependency2 = new Dependency2(dependency1);
set(dependency2.someMethod.bind(dependency2));
// now `dependency1` can use `dependency2.someMethod`
```

**API Reference**:

- **Required** defaultFn: Any your placeholder function / null-object

**Returns** object `Delegate`: `{ call, set, reset }`
