import assert from "node:assert/strict";
import test from "node:test";

import { createUseCardanoOp, executeWithSafety, useCardanoError } from "../src/react/index.ts";
import type { HookBindings, UseCardanoOpResult } from "../src/react/index.ts";

function createHookHarness<TArgs extends unknown[], TData>(
  operation: (...args: TArgs) => Promise<TData>,
  useConfigHooks = true
): {
  render: () => UseCardanoOpResult<TArgs, TData>;
} {
  const slots: unknown[] = [];
  let cursor = 0;

  const bindings: HookBindings = {
    useState<T>(initial: T) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = initial;
      }

      const setState = (value: T | ((prev: T) => T)) => {
        const prev = slots[index] as T;
        slots[index] = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      };

      return [slots[index] as T, setState];
    },
    useCallback<T extends (...args: any[]) => unknown>(
      callback: T,
      _deps: readonly unknown[]
    ): T {
      cursor++;
      return callback;
    }
  };

  return {
    render() {
      cursor = 0;
      const config = useConfigHooks
        ? {
            hooks: bindings
          }
        : undefined;

      return useCardanoError({
        operation,
        defaults: {
          source: "provider_submit",
          stage: "submit",
          provider: "blockfrost"
        },
        config
      });
    }
  };
}

test("useCardanoError drives hook state using defaults/config API", async () => {
  const harness = createHookHarness(async (tx: string) => `ok:${tx}`);
  let hook = harness.render();

  assert.equal(hook.loading, false);
  assert.equal(hook.data, undefined);
  assert.equal(hook.error, undefined);

  const pending = hook.run("abc");
  hook = harness.render();
  assert.equal(hook.loading, true);

  const result = await pending;
  assert.equal(result, "ok:abc");

  hook = harness.render();
  assert.equal(hook.loading, false);
  assert.equal(hook.data, "ok:abc");
  assert.equal(hook.error, undefined);
});

test("useCardanoError resolves hook bindings from runtime React when config.hooks is omitted", async () => {
  const runtime = globalThis as unknown as {
    React?: HookBindings;
  };

  const slots: unknown[] = [];
  let cursor = 0;
  runtime.React = {
    useState<T>(initial: T) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = initial;
      }

      const setState = (value: T | ((prev: T) => T)) => {
        const prev = slots[index] as T;
        slots[index] = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      };

      return [slots[index] as T, setState];
    },
    useCallback<T extends (...args: any[]) => unknown>(callback: T): T {
      cursor++;
      return callback;
    }
  };

  try {
    const render = () => {
      cursor = 0;
      return useCardanoError({
        operation: async (tx: string) => `ok:${tx}`,
        defaults: {
          source: "provider_submit",
          stage: "submit",
          provider: "blockfrost"
        }
      });
    };

    let hook = render();
    const pending = hook.run("abc");
    hook = render();
    assert.equal(hook.loading, true);

    const result = await pending;
    assert.equal(result, "ok:abc");

    hook = render();
    assert.equal(hook.loading, false);
    assert.equal(hook.data, "ok:abc");
    assert.equal(hook.error, undefined);
  } finally {
    delete runtime.React;
  }
});

test("react index re-exports createUseCardanoOp for compatibility", () => {
  assert.equal(typeof createUseCardanoOp, "function");
});

test("executeWithSafety normalizes thrown errors and calls onError", async () => {
  let capturedCode = "";
  let capturedArg = "";

  const submitTx = executeWithSafety(
    async (cborHex: string) => {
      throw {
        status_code: 425,
        error: "Mempool Full",
        message: `full:${cborHex}`
      };
    },
    {
      ctx: {
        source: "provider_submit",
        stage: "submit",
        provider: "blockfrost"
      },
      onError(normalized, args) {
        capturedCode = normalized.code;
        capturedArg = args[0];
      }
    }
  );

  await assert.rejects(
    () => submitTx("cbor_1"),
    (err: unknown) => {
      const normalized = err as { name: string; code: string; provider?: string };
      assert.equal(normalized.name, "CardanoAppError");
      assert.equal(normalized.code, "MEMPOOL_FULL");
      assert.equal(normalized.provider, "blockfrost");
      return true;
    }
  );

  assert.equal(capturedCode, "MEMPOOL_FULL");
  assert.equal(capturedArg, "cbor_1");
});

test("useCardanoError supports normalizerConfig for matcher + trace transitions", async () => {
  const slots: unknown[] = [];
  let cursor = 0;

  const bindings: HookBindings = {
    useState<T>(initial: T) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = initial;
      }

      const setState = (value: T | ((prev: T) => T)) => {
        const prev = slots[index] as T;
        slots[index] = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      };

      return [slots[index] as T, setState];
    },
    useCallback<T extends (...args: any[]) => unknown>(callback: T): T {
      cursor++;
      return callback;
    }
  };

  const render = () => {
    cursor = 0;
    return useCardanoError({
      operation: async () => {
        throw {
          message: "request timeout",
          trace: "line 1\nline 2"
        };
      },
      defaults: {
        source: "provider_submit",
        stage: "submit"
      },
      config: {
        hooks: bindings,
        normalizerConfig: {
          parseTraces: true
        }
      }
    });
  };

  let hook = render();
  await assert.rejects(() => hook.run());
  hook = render();

  assert.equal(hook.error?.code, "TIMEOUT");
  assert.equal(hook.error?.resolution?.title, "Retry timed-out request");
  assert.deepEqual(hook.error?.meta?.traces, ["line 1", "line 2"]);
});

test("useCardanoError normalize merges defaults and overrides", () => {
  const slots: unknown[] = [];
  let cursor = 0;
  const bindings: HookBindings = {
    useState<T>(initial: T) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = initial;
      }

      const setState = (value: T | ((prev: T) => T)) => {
        const prev = slots[index] as T;
        slots[index] = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      };

      return [slots[index] as T, setState];
    },
    useCallback<T extends (...args: any[]) => unknown>(callback: T): T {
      cursor++;
      return callback;
    }
  };

  cursor = 0;
  const hook = useCardanoError({
    defaults: {
      source: "provider_submit",
      stage: "submit",
      provider: "blockfrost"
    },
    config: {
      hooks: bindings
    }
  });

  const normalized = hook.normalize(
    {
      status_code: 404,
      error: "Not Found",
      message: "missing"
    },
    {
      stage: "build"
    }
  );

  assert.equal(normalized.source, "provider_submit");
  assert.equal(normalized.stage, "build");
  assert.equal(normalized.code, "NOT_FOUND");
  assert.equal(normalized.provider, "blockfrost");
});

test("executeWithSafety uses custom normalizer precedence and ctx args", async () => {
  let capturedCtxArg = "";
  const customNormalizer = {
    normalize(err: unknown, ctx: { walletHint?: string }) {
      capturedCtxArg = String(ctx.walletHint);
      return {
        name: "CardanoAppError" as const,
        source: "provider_submit" as const,
        stage: "submit" as const,
        code: "WALLET_REFUSED" as const,
        severity: "error" as const,
        message: String((err as Error).message ?? "err"),
        timestamp: new Date().toISOString(),
        raw: err,
        originalError: err
      };
    }
  };

  const run = executeWithSafety(
    async (cborHex: string) => {
      throw new Error(`fail:${cborHex}`);
    },
    {
      ctx: (cborHex: string) => ({
        source: "provider_submit",
        stage: "submit",
        walletHint: cborHex
      }),
      normalizer: customNormalizer,
      normalizerConfig: {
        parseTraces: true
      }
    }
  );

  await assert.rejects(
    () => run("tx_777"),
    (err: unknown) => {
      const normalized = err as { code: string };
      assert.equal(normalized.code, "WALLET_REFUSED");
      return true;
    }
  );

  assert.equal(capturedCtxArg, "tx_777");
});
