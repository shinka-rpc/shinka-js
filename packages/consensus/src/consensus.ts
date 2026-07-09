import { createResolver } from "./create-resolver";
import { murmurHash3_fmix32 } from "./mixers";
import { rotl32 } from "./bit-rotators";

export const consensus = createResolver(murmurHash3_fmix32, rotl32, 17);
