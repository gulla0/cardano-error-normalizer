import assert from "node:assert/strict";
import test from "node:test";

import { executeWithSafety, useCardanoError } from "../src/react/index.ts";
import type { HookBindings } from "../src/react/useCardanoOp.ts";
import type { UseCardanoOpResult } from "../src/react/useCardanoOp.ts";

function createHookHarness<TArgs extends unknown[], TData>(
  operation: (...args: TArgs) => Promise<TData>
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
      return useCardanoError({
        bindings,
        operation,
        ctx: {
          source: "provider_submit",
          stage: "submit",
          provider: "blockfrost"
        }
      });
    }
  };
}

test("useCardanoError drives hook state using config-style API", async () => {
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
