import { createResolver } from "./create-resolver";
import { murmurHash3_fmix32 } from "./mixers";
import { rotl32 } from "./bit-rotators";

export const consensus = createResolver(
  murmurHash3_fmix32,
  rotl32,
  [0x85ebca6b, 0xc2b2ae35],
  17,
);
