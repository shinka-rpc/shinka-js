export type MurmurHash3fmix32Const = [number, number];

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
