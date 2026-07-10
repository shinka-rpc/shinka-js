import { configure } from "./banshee";
import type { BansheeEnvironment, BansheeEventListener } from "./types";

export const testListeners = new Set<BansheeEventListener>();

const environment: BansheeEnvironment = {
  add: testListeners.add.bind(testListeners),
  rm: testListeners.delete.bind(testListeners),
};

configure(environment);
