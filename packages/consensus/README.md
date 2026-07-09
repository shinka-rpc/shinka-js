# @shinka-rpc/consensus

Symmetric RPC bus

A tiny library for deterministic conflict resolution between two independent
participants.

Imagine two people playing **rock–paper–scissors**. Neither player is stronger
than the other, and each choice has an equal chance to win or lose. The game
provides a fair way to break a tie.

This package solves a similar problem for software.

When two distributed peers independently decide that **one of them must win**,
choosing the winner by comparing numbers (`>`, `<`) introduces trivial
strategies ("always choose the largest value").

`@shinka-rpc/consensus` defines a symmetric duel between two randomly generated
nonces. Neither nonce is inherently "stronger" than another, and the outcome
depends on both values. If both peers evaluate the same pair of nonces, they
will always reach opposite conclusions: one wins, the other loses. Extremely
rare collisions can be handled by evaluating additional nonce pairs.

This package is intended for deterministic race-condition resolution in
distributed systems, where two independent participants must consistently elect
a single winner without introducing obvious winning strategies.

# Design goals

* Symmetric outcome
* No obvious winning values
* Deterministic evaluation
* Tiny implementation
* No dependencies
* No cryptographic primitives required

# API Reference

## `consensus` and `randInt32`

```typescript
import { consensus, randInt32, Consensus } from "@shinka-rpc/consensus";

// Integers
const a = randInt32();
const b = randInt32();

const status = consensus(a, b);

if (status === Consensus.UNKNOWN) console.log("Collision happened, no winner");
else if (status === Consensus.OK) console.log("`a` won, `b` lost");
else /* status === Consensus.FAIL */ console.log("`a` lost, `b` won");
```

## Protocol

The probability of no consensus decreases **exponentially** with the number of
independent `nonce`s

```typescript
import { createProtocol, consensus, randInt32 } from "@shinka-rpc/consensus";

export const [createNonces, consensusAll] = createProtocol({
  resolver: consensus,
  nonceLength: 5,
  randInt32,
});

// Arrays of 5 integers
const a = createNonces();
const b = createNonces();

const status = consensusAll(a, b);

if (status === Consensus.UNKNOWN) console.log("Collision happened, no winner");
else if (status === Consensus.OK) console.log("`a` won, `b` lost");
else /* status === Consensus.FAIL */ console.log("`a` lost, `b` won");
```

## Custom resolver

You can create your own resolver from provided building bricks. Please check
[consensus.ts](https://github.com/shinka-rpc/shinka-js/blob/0.1.x/packages/consensus/src/consensus.ts) and
[create-resolver.ts](https://github.com/shinka-rpc/shinka-js/blob/0.1.x/packages/consensus/src/create-resolver.ts)
implementations. Good luck!
