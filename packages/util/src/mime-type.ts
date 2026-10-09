export type StructuredMimeTypeParameters = Record<string, string>;

export type StructuredMimeType = {
  type: string;
  subtype?: string;
  parameters?: StructuredMimeTypeParameters;
};

const { entries: objectEntries } = Object;

const stringifyParametersMap = ({ 0: key, 1: value }: [string, string]) =>
  `${key}=${value}`;

const stringifyParameters = (parameters: StructuredMimeTypeParameters) =>
  objectEntries(parameters).map(stringifyParametersMap).join("; ");

export const joinMimeType = ({
  type,
  subtype,
  parameters,
}: StructuredMimeType) => {
  const parts: string[] = [type];
  if (subtype) parts.push("/", subtype);
  if (parameters) parts.push("; ", stringifyParameters(parameters));
  return parts.join("");
};

export const joinMimeSubtype = (
  subtype: StructuredMimeType["subtype"],
  next: string,
) => (subtype ? `${next}+${subtype}` : next);
