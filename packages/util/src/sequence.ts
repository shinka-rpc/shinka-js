/**
 * Creates a sequence generator function that returns auto-incrementing values.
 * This is useful for generating unique identifiers or sequence numbers.
 *
 * @param val - Optional initial value for the sequence (defaults to 0)
 * @returns A function that returns the next value in the sequence when called
 *
 * @example
 * ```typescript
 * const fromZero = sequence();
 * const fromFive = sequence(5);
 *
 * fromZero(); // returns 0
 * fromZero(); // returns 1
 * fromZero(); // returns 2
 *
 * fromFive(); // returns 5
 * fromFive(); // returns 6
 * fromFive(); // returns 7
 * ```
 */
export const sequence =
  (val = 0) =>
  () =>
    val++;
