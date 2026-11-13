# `@shinka-rpc/mime-type`

Provides a utility for rendering structured MIME media types into strings.

## `renderMimeType(structure)`

Serializes a `StructuredMimeType` object into a MIME media type string.

```typescript
renderMimeType(structure: StructuredMimeType): string
```

The structure has the following properties:

- `type` — required media type token.
- `subtype` — required media subtype token.
- `parameters` — optional record of parameter names and string values.

### Basic usage

```typescript
renderMimeType({
  type: "text",
  subtype: "plain",
});
// "text/plain"
```

Both `type` and `subtype` are required. The resulting media type follows the `type "/" subtype` syntax defined by RFC 9110.

### Parameters

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

Parameter values are encoded using [`RFC9110EncodeParameterValue`](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/mime-type/rfc-9110-parameter-value.html). Values that can be represented as tokens are emitted without quotes; other values are emitted as quoted strings with the required escaping.

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

The function validates `type`, `subtype`, and parameter names using `RFC9110TokenRe`.

Parameter values are encoded using `RFC9110EncodeParameterValue`, which applies its own validation rules.

Invalid type tokens, subtype tokens, parameter names, or parameter values cause a `TypeError` to be thrown.

### Notes

- Both `type` and `subtype` must be non-empty tokens.
- Parameter values follow the ASCII profile supported by `RFC9110EncodeParameterValue`; this is not full support for every character permitted by RFC 9110.
- Parameter order follows JavaScript's `Object.entries()` ordering for the supplied record.
- The function does not normalize the casing of type, subtype, or parameter names.
