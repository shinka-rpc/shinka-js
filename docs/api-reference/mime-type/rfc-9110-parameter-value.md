# RFC 9110 Parameter Value Encoding

Utilities for encoding and decoding HTTP parameter values according to the parameter-value syntax defined in [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html).

The implementation supports the ASCII subset of RFC 9110 and provides two functions:

- `RFC9110EncodeParameterValue` — encodes a parameter value into a valid `token` or `quoted-string`.
- `RFC9110DecodeParameterValue` — decodes a `token` or `quoted-string` into its original value.

## Supported syntax

RFC 9110 defines parameter values using the following syntax:

```abnf
parameter = parameter-name "=" parameter-value
parameter-value = token / quoted-string
```

This implementation supports:

- **`token`** — non-empty values containing only characters allowed by the HTTP `tchar` grammar.
- **`quoted-string`** — values enclosed in double quotes.
- **`quoted-pair`** — escaped characters represented by a backslash followed by an allowed character.

The encoder uses the shortest representation: values that qualify as `token` are returned without quotes; other supported values are enclosed in double quotes.

Within a `quoted-string`, double quotes and backslashes are escaped with a backslash.

## ASCII profile

The implementation intentionally supports a restricted ASCII profile:

- HTAB (`0x09`) is allowed.
- Printable ASCII characters (`0x20–0x7E`) are allowed, subject to the `quoted-string` escaping rules.
- Other control characters and DEL (`0x7F`) are rejected.
- Non-ASCII characters and `obs-text` (`0x80–0xFF`) are not supported.

This restriction keeps the encoder and decoder symmetric and avoids treating arbitrary JavaScript Unicode strings as HTTP header octets.

## API

### `RFC9110EncodeParameterValue`

```ts
RFC9110EncodeParameterValue(value: string): string
```

Encodes a parameter value.

If `value` consists entirely of valid `token` characters, it is returned unchanged. Otherwise, it is encoded as a `quoted-string`, escaping double quotes and backslashes.

Throws `TypeError` if the value contains characters outside the supported ASCII profile.

Examples:

```ts
RFC9110EncodeParameterValue("hello");
// "hello"

RFC9110EncodeParameterValue("my document");
// '"my document"'

RFC9110EncodeParameterValue('a"b');
// '"a\\"b"'

RFC9110EncodeParameterValue("a\\b");
// '"a\\\\b"'

RFC9110EncodeParameterValue("");
// '""'
```

### `RFC9110DecodeParameterValue`

```ts
RFC9110DecodeParameterValue(value: string): string
```

Decodes a `token` or `quoted-string`.

For quoted values, surrounding quotes are removed and `quoted-pair` sequences are decoded by removing the escape backslash.

The decoder validates the input syntax and throws `TypeError` for malformed values or characters outside the supported ASCII profile.

Examples:

```ts
RFC9110DecodeParameterValue("hello");
// "hello"

RFC9110DecodeParameterValue('"my document"');
// "my document"

RFC9110DecodeParameterValue('"a\\"b"');
// 'a"b'

RFC9110DecodeParameterValue('"a\\\\b"');
// "a\\b"

RFC9110DecodeParameterValue('"\\d"');
// "d"
```

## Round-trip behavior

For every value supported by the encoder:

```ts
const value = 'a "quoted" value';

const encoded = RFC9110EncodeParameterValue(value);
const decoded = RFC9110DecodeParameterValue(encoded);

console.log(decoded === value); // true
```

The encoder and decoder are designed to be complementary: encoding a supported value and decoding the result produces the original value.

## Error handling

Both functions throw `TypeError` when their input violates the supported syntax.

The encoder reports an invalid MIME parameter value, while the decoder reports an invalid HTTP parameter value.

The decoder does not attempt to repair malformed input.

## Scope

These utilities operate on **parameter values only**. They do not parse or serialize complete HTTP header fields, validate parameter names, or assemble media types.

For example, when constructing a `Content-Type` value, the caller remains responsible for validating the media type and parameter names and assembling the complete field syntax.
