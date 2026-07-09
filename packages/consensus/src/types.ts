import type { Consensus } from "./constants";

export type RandInt32 = () => number;
export type Mixer<T> = (n: number, settings: T) => number;
export type BitRotator = (value: number, shift: number) => number;
export type Resolver = (a: number, b: number) => Consensus;
