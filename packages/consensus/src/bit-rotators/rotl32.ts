export const rotl32 = (x: number, shift: number) => {
  shift &= 31;
  return ((x << shift) | (x >>> (32 - shift))) >>> 0;
};
