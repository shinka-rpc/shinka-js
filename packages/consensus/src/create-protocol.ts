import { Consensus } from "./constants";
import type { RandInt32, Resolver } from "./types";

export type CreateProtocolProps = {
  nonceLength: number;
  randInt32: RandInt32;
  resolver: Resolver;
};

export const createProtocol = ({
  nonceLength,
  randInt32,
  resolver,
}: CreateProtocolProps) => {
  const emptyNonces = Object.freeze(Array(nonceLength).fill(undefined));
  const createNonces = () => emptyNonces.map(randInt32);
  const consensusAll = (a: number[], b: number[]) => {
    for (let i = 0; i < nonceLength; i++) {
      const status = resolver(a[i], b[i]);
      if (status !== Consensus.UNKNOWN) return status;
    }
    return Consensus.UNKNOWN;
  };
  return [createNonces, consensusAll] as [
    typeof createNonces,
    typeof consensusAll,
  ];
};

export type ConsensusProtocol = ReturnType<typeof createProtocol>;
