export type Squirrel3Const = [number, number, number, number];

// [0xb5297a4d, 0x68e31da4, 0x1b56c4e9, 0x85ebca6b]

export const squirrel3 = (x: number, [c1, c2, c3, c4]: Squirrel3Const) => {
  x = Math.imul(x, c1);
  x += c2;
  x ^= x >>> 8;
  x += c3;
  x ^= x << 8;
  x = Math.imul(x, c4);
  x ^= x >>> 8;
  return x >>> 0;
};
