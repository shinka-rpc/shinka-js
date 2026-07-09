import { createProtocol, consensus, randInt32 } from "@shinka-rpc/consensus";

export const [createNonces, consensusAll] = createProtocol({
  resolver: consensus,
  nonceLength: 5,
  randInt32,
});
