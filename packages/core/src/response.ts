import type { ShinkaMeta } from "./types";

/**
 * A generic class that represents a response with a value and optional metadata.
 * This class is commonly used to wrap return values along with transport and
 * serialization metadata for the Shinka RPC system
 *
 * @template T - The type of the response value
 *
 * @example
 * ```typescript
 * // Basic usage with just a value
 * return new Response("success");
 * // returns "success"
 * throw new Response("error");
 * // throws "error"
 *
 * // Usage with value and metadata
 * return new Response("data", {
 *   transport: { timeout: 5000 },
 *   serialize: { compress: "gzip" }
 * });
 * // returns "data"
 *
 * // Usage with value and metadata
 * throw new Response("error", {
 *   transport: { timeout: 5000 },
 *   serialize: { compress: "gzip" }
 * });
 * // throws "error"
 * ```
 */
export class Response<T> {
  /**
   * The main value of the response
   */
  value: T;

  /**
   * Optional metadata containing transport and serialization options
   */
  metadata?: ShinkaMeta;

  /**
   * Creates a new Response instance.
   *
   * @param value - The main value to store
   * @param metadata - Optional metadata containing transport and serialization options
   */
  constructor(value: T, metadata?: ShinkaMeta) {
    this.value = value;
    this.metadata = metadata;
  }
}
