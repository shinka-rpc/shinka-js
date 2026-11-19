# `handleCache`

A small stateless helper for retrieving a value from a map-like cache or creating and storing it when the key is missing.

```typescript
handleCache<K, V>(
  cache: MapLike<K, V>,
  factory: (key: K) => V,
  key: K,
): V
```

## Parameters

- `cache` — a map-like object providing `get`, `has`, and `set` operations.
- `factory` — a function that creates a value for the given key.
- `key` — the key to look up or populate.

## Behavior

`handleCache` checks whether the cache contains the specified key.

- If the key exists, its cached value is returned.
- Otherwise, `factory` is called with the key, its result is stored in the cache, and that result is returned.

```typescript
const cache = new Map<number, number>();

const square = (n: number) => n ** 2;

handleCache(cache, square, 2); // 4 — created and cached
handleCache(cache, square, 3); // 9 — created and cached
handleCache(cache, square, 2); // 4 — returned from cache
```

The factory is called only when the key is absent.

## Stateless design

`handleCache` does not maintain an internal cache or any other state. The caller owns the cache and controls its lifetime, storage strategy, and key semantics.

This makes the helper suitable for lightweight memoization around existing map-like objects without introducing another stateful abstraction.

For example, it can be used to cache `thisArg` values in `@shinka-rpc/libserializer/high-order`.

## Notes

- The cache is checked using `has`, not by testing the result of `get`. Therefore, values such as `undefined`, `null`, `false`, and `0` can be cached correctly.
- The factory is synchronous. This utility does not provide asynchronous memoization or single-flight behavior.
- If the factory throws, no value is stored.
- Errors from cache operations are propagated to the caller.
