export const rotr32 = (x: number, n: number): number => {
  n &= 31;
  return (x >>> n) | (x << (32 - n));
};
