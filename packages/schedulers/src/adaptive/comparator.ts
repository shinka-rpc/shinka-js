import type { Comparator } from "./types";

export const comparatorAsc: Comparator = (a, b) => a[0][0] - b[0][0];
export const comparatorDesc: Comparator = (a, b) => b[0][0] - a[0][0];
