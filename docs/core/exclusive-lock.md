# ExclusiveLock

`exclusiveLock` is a synchronization mechanism that allows every component
to temporarily obtain exclusive access to the communication channel.

Its primary purpose is to perform protocol-critical operations that must not
race with normal message exchange. A typical example is a `serializer` that
manages encryption keys. During a key rotation, both peers must ensure that no
messages are transmitted using an inconsistent encryption state. Simply relying
on local locks is insufficient because communication is distributed between two
independent peers.

When a component acquires an `exclusiveLock`, the request is propagated to the
remote peer through the corresponding `shinka` channel. Once both sides
acknowledge the lock, normal outgoing communication is effectively paused.

Instead of sending messages immediately, every other component transparently
queues its outgoing messages. From their perspective, `sendMessage` continues to
behave normally — they do not need to be aware that the connection is locked.
Internally, messages are accumulated until the lock is released.

The component that owns the lock remains free to exchange the protocol messages
required to complete the exclusive operation (for example, negotiating or
confirming a new encryption key).

When the lock is released, queued messages are flushed in their original order,
and normal communication resumes automatically.

This mechanism provides a safe way to perform distributed state transitions
without exposing other components to race conditions or requiring them to
implement their own synchronization logic.
