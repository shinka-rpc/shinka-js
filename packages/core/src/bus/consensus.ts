import { NBConsensus } from "./handlers/non-blocking";

const murmurHash3_fmix32 = (h: number) => {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
};

const rotl32 = (x: number, shift: number) => {
  shift &= 31;
  return ((x << shift) | (x >>> (32 - shift))) >>> 0;
};

export const consensus = (a: number, b: number) => {
  const scoreA = murmurHash3_fmix32(a ^ rotl32(b, 17));
  const scoreB = murmurHash3_fmix32(b ^ rotl32(a, 17));
  return scoreA === scoreB
    ? NBConsensus.UNKNOWN
    : scoreA < scoreB
      ? NBConsensus.FAIL
      : NBConsensus.OK;
};
