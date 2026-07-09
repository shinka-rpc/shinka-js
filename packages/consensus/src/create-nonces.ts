import { nonceLength } from "./constants";
import { randInt32 } from "./rand-int32";

const emptyNonces = Object.freeze(Array(nonceLength));
export const createNonces = () => emptyNonces.map(randInt32);
