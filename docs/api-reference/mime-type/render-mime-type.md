# MIME Type Utilities

Utilities for composing MIME type strings from structured components.

## `renderMimeType(structure)`

Serializes a `StructuredMimeType` object into a MIME type string.

```typescript
renderMimeType(structure: StructuredMimeType): string
```

The structure has the following properties:

- `type` — required type token.
- `subtype` — optional subtype token.
- `parameters` — optional record of parameter names and string values.

### Examples

```typescript
renderMimeType({
  type: "text",
  subtype: "plain",
});
// "text/plain"
```

Parameters are appended as semicolon-separated name/value pairs:

```typescript
renderMimeType({
  type: "text",
  subtype: "plain",
  parameters: {
    charset: "utf-8",
    name: "my document",
  },
});
// 'text/plain; charset=utf-8; name="my document"'
```

Parameter values are encoded using `RFC9110EncodeParameterValue`. Values that can be represented as tokens are emitted without quotes; other values are emitted as quoted strings with the required escaping.

```typescript
renderMimeType({
  type: "text",
  subtype: "plain",
  parameters: {
    empty: "",
    quoted: 'a"b',
    escaped: "a\\b",
  },
});
// 'text/plain; empty=""; quoted="a\\"b"; escaped="a\\\\b"'
```

An empty parameter record does not add a trailing semicolon:

```typescript
renderMimeType({
  type: "application",
  subtype: "json",
  parameters: {},
});
// "application/json"
```

### Validation

The function validates the type, a supplied subtype, and parameter names using `RFC9110TokenRe`.

Parameter values are encoded using `RFC9110EncodeParameterValue`, which applies its own validation rules.

Invalid type tokens, subtype tokens, parameter names, or parameter values cause a `TypeError` to be thrown.

### Optional subtype

The `subtype` property is optional. When omitted, the function returns the type token without a slash or subtype:

```typescript
renderMimeType({ type: "text" });
// "text"
```

This is a partial representation, not a complete MIME media type. A complete media type requires both a type and a non-empty subtype, as defined by RFC 9110.

If `subtype` is supplied as an empty string, validation fails rather than silently omitting it.

### Notes

- Type, subtype, and parameter names are validated as tokens.
- Parameter values follow the ASCII profile supported by `RFC9110EncodeParameterValue`; this is not full support for every character permitted by RFC 9110.
- Parameter order follows JavaScript's `Object.entries()` ordering for the supplied record.
- The function does not normalize the casing of type, subtype, or parameter names.
