import { Consensus } from "./constants";
import type { Mixer, BitRotator, Resolver } from "./types";

export const createResolver = (mix: Mixer, rot: BitRotator, rotate: number) =>
  ((a: number, b: number) => {
    const scoreA = mix(a ^ rot(b, rotate));
    const scoreB = mix(b ^ rot(a, rotate));
    return scoreA === scoreB
      ? Consensus.UNKNOWN
      : scoreA < scoreB
        ? Consensus.FAIL
        : Consensus.OK;
  }) as Resolver;
