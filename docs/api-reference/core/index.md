# Core

Ironically the `core` know how to do everything but it is made so abstract that
as it unable to do anything. So to make `@shinka-rpc` be able to do things, you
have to configure **outscope**, **transport**, (often) **serializer** and you
also may need in **limon**.

![diagram](../../img/how-shinka-rpc-works.svg "How `@shinka-rpc` works")

## Basic principles

- `request` **requires** the response. Good analogy is
  [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

- `dataEvent` **doesn't expect** the response. Good analogy is
  [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)

- `request` and `dataEvent` registries are **separated**. If you want call any
  remote handler and conditionally expect or ignore the answer, you may
  register it twice

- Public instancies are **frozen** / `Object.freeze()`. If you want to store
  bus-related metadata, you may use `bus.extra` attribute

- Both `request` and `dataEvent` handlers accept 2 args:
  - `any` payload passed by interlocutor. Need to pass more arguments?
  ~~Buy premium version for $4.99~~ Use `Array` or `Object` to pack them
  - `thisArg`. In `user shinka` case it's `Client` as is or `Bus` for `Server`

## Barrier to Entry

The only unique thing of ShinkaRPC is [OutScope](../outscope.md). In very simple
words it's mandatory environment integration, converted into dependency.
