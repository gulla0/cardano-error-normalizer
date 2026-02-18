import assert from "node:assert/strict";
import test from "node:test";

import { createUseCardanoOp, type HookBindings } from "../src/react/useCardanoOp.ts";
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

  const useCardanoOp = createUseCardanoOp(bindings);

  return {
    render() {
      cursor = 0;
      return useCardanoOp(operation, {
        ctx: {
          source: "provider_submit",
          stage: "submit",
          provider: "blockfrost"
        }
      });
    }
  };
}

test("useCardanoOp manages loading and data for successful runs", async () => {
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

test("useCardanoOp normalizes thrown errors and rethrows CardanoAppError", async () => {
  const harness = createHookHarness(async () => {
    throw {
      status_code: 429,
      error: "Too Many Requests",
      message: "Rate limited"
    };
  });

  let hook = harness.render();

  await assert.rejects(
    () => hook.run(),
    (err: unknown) => {
      const normalized = err as { name: string; code: string; provider?: string };
      assert.equal(normalized.name, "CardanoAppError");
      assert.equal(normalized.code, "RATE_LIMITED");
      assert.equal(normalized.provider, "blockfrost");
      return true;
    }
  );

  hook = harness.render();
  assert.equal(hook.loading, false);
  assert.equal(hook.error?.code, "RATE_LIMITED");
  assert.equal(hook.data, undefined);
});

test("useCardanoOp reset clears loading/data/error state", async () => {
  const harness = createHookHarness(async () => "tx_hash");
  let hook = harness.render();

  await hook.run();
  hook = harness.render();
  assert.equal(hook.data, "tx_hash");

  hook.reset();
  hook = harness.render();
  assert.equal(hook.loading, false);
  assert.equal(hook.data, undefined);
  assert.equal(hook.error, undefined);
});
