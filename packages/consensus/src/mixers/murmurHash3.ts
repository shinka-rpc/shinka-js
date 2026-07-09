export type MurmurHash3fmix32Const = [number, number];

// [0x85ebca6b, 0xc2b2ae35]

export const murmurHash3_fmix32 = (
  h: number,
  [c1, c2]: MurmurHash3fmix32Const,
) => {
  h ^= h >>> 16;
  h = Math.imul(h, c1);
  h ^= h >>> 13;
  h = Math.imul(h, c2);
  h ^= h >>> 16;
  return h >>> 0;
};
