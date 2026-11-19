# `sleep`

An abortable Promise-based wrapper around `setTimeout`.

`sleep()` returns a Promise that resolves after the specified number of milliseconds or rejects if the provided `AbortSignal` is aborted.

## Import

```typescript
import { sleep } from "@shinka-rpc/util";
```

## Usage

**Basic usage:**

```typescript
await sleep(250);
```

**Aborting:**

```typescript
const abort = new AbortController();

const sleepPromise = sleep(250, { signal: abort.signal });

abort.abort("example");

await sleepPromise; // rejects with "example"
```

When aborted, the pending timeout is cleared and the Promise rejects with `signal.reason`.

**Already aborted:**

```typescript
const abort = new AbortController();

abort.abort("example");

const sleepPromise = sleep(250, { signal: abort.signal });

await sleepPromise; // rejects with "example"
```

If the signal is already aborted when `sleep()` is called, the Promise rejects immediately without scheduling a timeout.

## API Reference

```typescript
type SleepOpts = {
  signal?: AbortSignal;
};

function sleep(
  time: number,
  opts?: SleepOpts,
): Promise<void>;
```

| Parameter | Type | Description |
|---|---|---|
| `time` | `number` | Required. Timeout duration in milliseconds, passed directly to `setTimeout`. |
| `opts` | `SleepOpts` | Optional configuration object. |
| `opts.signal` | `AbortSignal` | Optional cancellation signal. |

**Returns:** `Promise<void>` — resolves when the timeout expires or rejects with `signal.reason` when aborted.

