# Concurrency

A collection of reusable asynchronous primitives and synchronization tools for JavaScript and TypeScript.

## Primitives

### [ReusablePromise](./reusable-promise.md)

A reusable Promise primitive that allows asynchronous operations to be coordinated through a promise whose underlying state can be reset and reused.

### [Semaphore](./semaphore.md)

A synchronization primitive that controls concurrent access to a shared resource by limiting the number of simultaneous holders. A **Mutex** is a special case of a semaphore with a capacity of one.

### [Asynq](./asynq.md)

An asynchronous FIFO queue that allows producers and consumers to exchange values without requiring them to operate at the same time.

### [CoalescingTransition](./coalescing-transition.md)

An asynchronous state transition primitive that coalesces concurrent requests targeting the same pending state, ensuring that equivalent transitions share a single execution.

### [TransitionQueue](./transition-queue.md)

An asynchronous FIFO task queue that executes different asynchronous functions sequentially, preserving their submission order and independently handling their results.
