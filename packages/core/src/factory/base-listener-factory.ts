export const baseListenerFactory =
  <K extends string, S>(keys: K[], Type: new () => S) =>
  () =>
    Object.fromEntries(keys.map((k) => [k, new Type()])) as Record<K, S>;
