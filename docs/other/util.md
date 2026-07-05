# sequence

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

# sleep

Simple wrapper over `setTimeout` and `Promise`

```typescript
import { sleep } from "@shinka-rpc/util/sleep";

await sleep(250);
```

**API Reference**:

- **Required** time: `Number` of milliseconds, passed directly to `setTimeout`

# delegate

Implements [delegate](https://en.wikipedia.org/wiki/Delegation_pattern) pattern
in `forwardRef` manner to make possible late binding to resolve circular
dependency problem

```typescript
import { delegate } from "@shinka-rpc/util/delegate";

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

# banshee

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
