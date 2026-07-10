import {
  createProtocol,
  defaultResolver,
  randInt32,
} from "@shinka-rpc/consensus";

export const [createNonces, consensusAll] = createProtocol({
  resolver: defaultResolver,
  nonceLength: 5,
  randInt32,
});
