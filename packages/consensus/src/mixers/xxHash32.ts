export type xxHash32AvalancheConst = [number, number];

// [0x85ebca77, 0xc2b2ae3d]

export const xxHash32Avalanche = (
  h: number,
  [c1, c2]: xxHash32AvalancheConst,
) => {
  h ^= h >>> 15;
  h = Math.imul(h, c1);
  h ^= h >>> 13;
  h = Math.imul(h, c2);
  h ^= h >>> 16;
  return h >>> 0;
};
