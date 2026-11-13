const { fromEntries: objectFromEntries } = Object;

export const baseListenerFactory =
  <K extends string, S>(keys: K[], Type: new () => S) =>
  () =>
    objectFromEntries(keys.map((k) => [k, new Type()])) as Record<K, S>;
