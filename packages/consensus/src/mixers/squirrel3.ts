export const squirrel3 = (x: number) => {
  x = Math.imul(x, 0xb5297a4d);
  x += 0x68e31da4;
  x ^= x >>> 8;
  x += 0x1b56c4e9;
  x ^= x << 8;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 8;
  return x >>> 0;
};
