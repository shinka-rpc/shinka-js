import type { Consensus } from "./constants";

export type RandInt32 = () => number;
export type Mixer = (n: number) => number;
export type BitRotator = (value: number, shift: number) => number;
export type Resolver = (a: number, b: number) => Consensus;
export type ScoreFn = (a: number, b: number) => number;
