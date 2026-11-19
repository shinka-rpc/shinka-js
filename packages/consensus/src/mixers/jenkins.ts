export const jenkins32 = (x: number) => {
  x += x << 12;
  x ^= x >>> 22;
  x += x << 4;
  x ^= x >>> 9;
  x += x << 10;
  x ^= x >>> 2;
  x += x << 7;
  x ^= x >>> 12;
  return x >>> 0;
};
