import { expect, test } from "@jest/globals";

import { disposeContext, asyncDisposeContext } from "../src";

type Results = string[];

test("dispose-context", () => {
  const results: Results = [];
  const dispose = () => results.push("DISPOSED");
  {
    results.push("PRE-USING");
    using ctx = disposeContext(dispose);
    expect(ctx.dispose).toBe(dispose);
    expect(ctx[Symbol.dispose]).toBe(dispose);
    expect(Object.isFrozen(ctx)).toBe(true);
    results.push("POST-USING");
  }
  results.push("---");
  const ctx = disposeContext(dispose);
  try {
  } finally {
    ctx.dispose();
  }

  expect(results).toStrictEqual([
    "PRE-USING",
    "POST-USING",
    "DISPOSED",
    "---",
    "DISPOSED",
  ]);
});

test("async-dispose-context", async () => {
  const results: Results = [];
  const aDispose = async () => {
    results.push("ASYNC_DISPOSED");
  };
  {
    results.push("PRE-USING");
    await using ctx = asyncDisposeContext(aDispose);
    expect(ctx.aDispose).toBe(aDispose);
    expect(ctx[Symbol.asyncDispose]).toBe(aDispose);
    expect(Object.isFrozen(ctx)).toBe(true);
    results.push("POST-USING");
  }
  results.push("---");
  const ctx = asyncDisposeContext(aDispose);
  try {
  } finally {
    await ctx.aDispose();
  }

  expect(results).toStrictEqual([
    "PRE-USING",
    "POST-USING",
    "ASYNC_DISPOSED",
    "---",
    "ASYNC_DISPOSED",
  ]);
});
