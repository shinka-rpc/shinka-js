import type { ShinkaMeta } from "./types";

export class Response<T> {
  value: T;
  metadata?: ShinkaMeta;

  constructor(value: T, metadata?: ShinkaMeta) {
    this.value = value;
    this.metadata = metadata;
  }
}
