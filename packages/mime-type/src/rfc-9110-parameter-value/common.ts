export const throwTypeError = (type: string) => {
  const text = `Invalid ${type} parameter value`;
  return () => {
    throw new TypeError(text);
  };
};
