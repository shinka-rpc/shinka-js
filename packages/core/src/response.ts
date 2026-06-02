import type { ShinkaMeta } from "./types";

export class Response<SO, TO, T> {
  value: T;
  metadata?: ShinkaMeta<SO, TO>;

  constructor(value: T, metadata?: ShinkaMeta<SO, TO>) {
    this.value = value;
    this.metadata = metadata;
  }
}
