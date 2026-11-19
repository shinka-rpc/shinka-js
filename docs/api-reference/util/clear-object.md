# `clearObject` and `curryClearObject`

Utilities for removing all own enumerable string-keyed properties from an object without replacing the object itself.

These functions are useful when an object's identity must be preserved while clearing its contents, such as when resetting shared state.

## Usage

**Direct cleanup:**

```typescript
import { clearObject } from "@shinka-rpc/util";

const state = {
  connected: true,
  attempts: 3,
};

const reference = state;

clearObject(state);

console.log(state); // {}
console.log(state === reference); // true
```

**Reusable cleanup function:**

```typescript
import { curryClearObject } from "@shinka-rpc/util";

const state = {
  connected: true,
  attempts: 3,
};

const clearState = curryClearObject(state);

// Later
clearState();

console.log(state); // {}
```

`curryClearObject()` binds the target object in advance and returns a zero-argument cleanup function.

## API Reference

### `clearObject`

```typescript
function clearObject(
  state: Record<any, any>,
): void;
```

| Parameter | Type | Description |
|---|---|---|
| `state` | `Record<any, any>` | Object whose properties should be removed. |

**Returns:** `void`.

### `curryClearObject`

```typescript
function curryClearObject(
  state: Record<any, any>,
): () => void;
```

| Parameter | Type | Description |
|---|---|---|
| `state` | `Record<any, any>` | Object to be cleared when the returned function is invoked. |

**Returns:** `() => void` — a function that clears the specified object.

## Notes

- Both functions mutate the original object without changing its identity.
- Only own enumerable string-keyed properties are removed, following the behavior of `Object.keys()`.
- Inherited, non-enumerable, and symbol-keyed properties are not affected.
- Cleanup is shallow: nested objects are not recursively modified.
- Objects with non-configurable properties cannot necessarily be cleared. Attempting to delete such properties may throw in strict mode.
- The functions do not provide special handling for frozen objects or Proxy traps.
