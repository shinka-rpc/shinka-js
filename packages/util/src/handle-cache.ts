interface MapLike<K, V> {
  get: (key: K) => V | undefined;
  set: (key: K, val: V) => this;
  has: (key: K) => boolean;
}

export const handleCache = <K, V>(
  cache: MapLike<K, V>,
  factory: (key: K) => V,
  key: K,
) => {
  if (cache.has(key)) return cache.get(key)!;
  const value = factory(key);
  cache.set(key, value);
  return value;
};
