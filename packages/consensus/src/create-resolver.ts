import type { ScoreFn, Resolver } from "./types";

export const createResolver =
  (score: ScoreFn, resolve: Resolver) => (a: number, b: number) =>
    resolve(score(a, b), score(b, a));
