# `sequence`

Creates an independent auto-incrementing number generator.

Each call to `sequence()` returns a new function that produces the current value and increments it by one.

```typescript
import { sequence } from "@shinka-rpc/util";

const fromZero = sequence();
const fromFive = sequence(5);

fromZero(); // 0
fromZero(); // 1
fromZero(); // 2

fromFive(); // 5
fromFive(); // 6
fromFive(); // 7
```

Each generated sequence maintains its own counter, independent of other sequences.

## API Reference

```typescript
type Sequence = () => number;

function sequence(initialValue?: number): Sequence;
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `initialValue` | `number` | `0` | Initial value of the sequence. |

**Returns:** `Sequence` — a function that returns the current counter value and increments it by one on each invocation.
