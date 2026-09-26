type AnyFn = (...args: any) => any;

export const delegate = <T extends AnyFn>(defaultFn: T) => {
  let current = defaultFn;
  const call = ((...args) => current(...args)) as T;
  const set = (value: T) => {
    current = value;
  };
  const reset = () => {
    current = defaultFn;
  };
  return { call, set, reset };
};

export type DelegateType<T extends AnyFn> = ReturnType<typeof delegate<T>>;
