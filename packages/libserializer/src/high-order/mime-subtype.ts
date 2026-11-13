import type { StructuredMimeType } from "@shinka-rpc/core";

export const joinMimeSubtype = (
  subtype: StructuredMimeType["subtype"],
  next: StructuredMimeType["subtype"],
) => `${next}+${subtype}`;
