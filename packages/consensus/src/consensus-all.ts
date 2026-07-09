import { Consensus, nonceLength } from "./constants";
import { consensus } from "./consensus";

export const consensusAll = (a: number[], b: number[]) => {
  for (let i = 0; i < nonceLength; i++) {
    const status = consensus(a[i], b[i]);
    if (status !== Consensus.UNKNOWN) return status;
  }
  return Consensus.UNKNOWN;
};
