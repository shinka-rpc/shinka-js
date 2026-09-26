import { createResolver } from "./create-resolver";
import { murmurHash3_fmix32 } from "./mixers";
import { rotl32 } from "./bit-rotators";
import { cmpResolver } from "./basic-resolvers";
import type { ScoreFn } from "./types";

const scoreFn: ScoreFn = (a, b) => murmurHash3_fmix32(a ^ rotl32(b, 17));
export const defaultResolver = createResolver(scoreFn, cmpResolver);
