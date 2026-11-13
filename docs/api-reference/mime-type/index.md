# MIME Type

A lightweight collection of utilities for working with MIME media types and HTTP parameter values.

The package provides RFC 9110 parameter value encoding and decoding, as well as rendering structured MIME media types into strings.

## Utilities

### RFC 9110 Parameter Value

**[`rfc-9110-parameter-value`](./rfc-9110-parameter-value.md)** provides:

- `RFC9110EncodeParameterValue` — encodes a parameter value using token or quoted-string syntax.
- `RFC9110DecodeParameterValue` — decodes token and quoted-string representations.

The implementation supports a strict ASCII profile: horizontal tabs and printable ASCII characters are accepted, while other control characters, non-ASCII characters, and `obs-text` are rejected.

These functions operate on parameter values only; they do not parse or render complete HTTP fields.

### MIME Type Rendering

**[`render-mime-type`](./render-mime-type.md)** provides:

- `renderMimeType` — renders a structured MIME media type, including its type, subtype, and optional parameters.

It validates type, subtype, and parameter names as HTTP tokens and uses `RFC9110EncodeParameterValue` to encode parameter values.

## Design

The package focuses on small, dependency-free utilities with clearly defined responsibilities.

Parameter value encoding and decoding can be used independently, while MIME type rendering builds on the encoder to produce complete media type strings.
