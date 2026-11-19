import { Consensus } from "../src";

const reflectionMap = new Map<Consensus, Consensus>([
  [Consensus.WON, Consensus.LOSE],
  [Consensus.LOSE, Consensus.WON],
  [Consensus.UNKNOWN, Consensus.UNKNOWN],
]);

export const reflection = (consensus: Consensus) => {
  if (!reflectionMap.has(consensus))
    throw new Error(`${consensus} is not valid consensus`);
  return reflectionMap.get(consensus)!;
};
