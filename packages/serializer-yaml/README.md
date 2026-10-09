# @shinka-rpc/serializer-yaml

A YAML serializer for [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
[Documentation is here](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/serializers/yaml.html)

This package integrates YAML serialization using [`js-yaml`](https://www.npmjs.com/package/js-yaml). YAML is a human-readable text format that can be useful when message readability is more important than compactness or serialization speed.

## Usage

```typescript
import serializer from "@shinka-rpc/serializer-yaml";
```

## Features

* **Human-readable format** — serializes messages as YAML text.
* **Configurable serialization** — supports the options provided by `js-yaml`'s `dump` function.
* **Minimal integration** — delegates serialization and deserialization to `js-yaml`.
* **Text transport** — configures the transport to use the `application/yaml` MIME type.

## Dependency

This package uses [`js-yaml`](https://www.npmjs.com/package/js-yaml) to serialize and deserialize YAML data.

## Configuration

`YamlSerializerOptions` is an alias for `js-yaml`'s `DumpOptions` type. All supported options are passed directly to the `dump` function.

Refer to the [`js-yaml` documentation](https://github.com/nodeca/js-yaml) for the available options and YAML-specific behavior.

The serializer configures the transport to use text mode with the `application/yaml` MIME type.

## Use as a Starting Point

This implementation can serve as a reference for integrating YAML or other text-based serialization formats with `@shinka-rpc/core`.

If you need a different YAML schema, custom value transformations, or another serialization format, you can copy and adapt the implementation to your requirements.

For the serializer interface and integration details, see [`@shinka-rpc/core`](https://www.npmjs.com/package/@shinka-rpc/core).
