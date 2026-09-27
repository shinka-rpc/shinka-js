# Opportunistic LiMon

Instead of sending heartbeat messages at fixed intervals, it uses the existing communication between peers whenever possible and schedules a heartbeat only when one becomes necessary. This reduces unnecessary heartbeat traffic while still detecting unresponsive connections within the configured timeout.

The behavior can be adjusted with timeout and threshold options.

## Options

`LiMonOpportunistic` accepts the following options:

| Option      | Type             | Default | Description                                                                                                  |
| ----------- | ---------------- | ------: | ------------------------------------------------------------------------------------------------------------ |
| `timeout`   | `number`         | `15000` | Maximum allowed period without receiving data before the connection is considered dead.                      |
| `threshold` | `number \| null` |  `null` | Tolerance used when scheduling liveness checks and heartbeat messages. `null` enables automatic calculation. |

### `timeout`

The `timeout` option defines the liveness timeout in milliseconds.

The monitor tracks the time since the last data was received. If no data is received within the configured timeout, the connection is considered unresponsive and the `Bus` is stopped.

The same value is also used when negotiating the timing of opportunistic heartbeat messages with the remote LiMon. Therefore, increasing `timeout` makes the monitor less aggressive: connections may remain silent for longer before a heartbeat is required or the connection is terminated.

```ts
LiMonOpportunistic({
  timeout: 30_000,
})
```

The default is `15_000` milliseconds.

### `threshold`

`threshold` defines the tolerance used by the scheduler when deciding whether a heartbeat is due or a timeout has been exceeded.

A non-zero threshold prevents the scheduler from reacting to very small timing differences and delays. It is especially useful because scheduling is not exact: timers may execute later than requested, and messages may arrive between scheduler invocations.

By default, `threshold` is calculated automatically from `timeout`:

```ts
threshold = timeout ** 0.33
```

For example, with the default `timeout` of `15_000` ms, the automatically calculated threshold is approximately `24.7` ms.

Set `threshold` explicitly when the default tolerance is not appropriate for the environment:

```ts
LiMonOpportunistic({
  timeout: 15_000,
  threshold: 50,
})
```

Set it to `0` to disable the tolerance:

```ts
LiMonOpportunistic({
  threshold: 0,
})
```

> `threshold` affects scheduling precision, not the configured liveness timeout itself. It should generally be kept small relative to `timeout`.
