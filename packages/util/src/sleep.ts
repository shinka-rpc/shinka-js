/**
 * Creates a Promise that resolves after the specified time delay.
 * This is a simple wrapper around setTimeout that returns a Promise.
 *
 * @param time - The delay time in milliseconds
 * @returns A Promise that resolves after the specified time
 *
 * @example
 * ```typescript
 * // Wait for 1 second
 * await sleep(1000);
 *
 * // Wait for 250ms
 * await sleep(250);
 * ```
 */
export const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));
