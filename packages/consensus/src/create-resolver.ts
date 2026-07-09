import { Consensus } from "./constants";
import type { Mixer, BitRotator, Resolver } from "./types";

export const createResolver = <T>(
  mix: Mixer<T>,
  rot: BitRotator,
  mixerSettings: T,
  rotate: number,
) =>
  ((a: number, b: number) => {
    const scoreA = mix(a ^ rot(b, rotate), mixerSettings);
    const scoreB = mix(b ^ rot(a, rotate), mixerSettings);
    return scoreA === scoreB
      ? Consensus.UNKNOWN
      : scoreA < scoreB
        ? Consensus.FAIL
        : Consensus.OK;
  }) as Resolver;
