export type wangHash32Const = [number, number];

// [9, 0x27d4eb2d]

export const wangHash32 = (x: number, [c1, c2]: wangHash32Const) => {
  x = x ^ 61 ^ (x >>> 16);
  x = Math.imul(x, c1);
  x ^= x >>> 4;
  x = Math.imul(x, c2);
  x ^= x >>> 15;
  return x >>> 0;
};
