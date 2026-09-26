# Liveness Monitors / `LiMon`s

`Bus` keeps track of the timestamps of the most recently received and sent
data using `performance.now()`

The `limon`'s responsibility is to decide, based on both its own timeout
configuration and the timeout settings provided by the remote side, whether
it should either:

* send a `heartbeat` message to the peer (indicating that we are still alive), or
* declare the data channel clinically dead, and it's time to `stop` the `Bus`

Exactly when and how these decisions are made is an implementation detail and
may vary between different `limon` implementations
