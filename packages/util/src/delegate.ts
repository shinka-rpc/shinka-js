export const delegate = <T>(defaultFn: T) => {
  let current = defaultFn;
  // @ts-expect-error: 2349, 7019
  const call = ((...args) => current(...args)) as T;
  const set = (value: T) => {
    current = value;
  };
  const reset = () => {
    current = defaultFn;
  };
  return { call, set, reset };
};

export type DelegateType<T> = ReturnType<typeof delegate<T>>;
