import test from "node:test";
import assert from "node:assert/strict";

import { withErrorSafety } from "../src/utils/safeProvider.ts";

test("withErrorSafety preserves successful async return values", async () => {
  const provider = {
    async submitTx(cborHex: string): Promise<string> {
      return `tx_${cborHex}`;
    }
  };

  const safeProvider = withErrorSafety(provider, {
    ctx: {
      source: "provider_submit",
      stage: "submit",
      provider: "blockfrost"
    }
  });

  const txHash = await safeProvider.submitTx("abc123");
  assert.equal(txHash, "tx_abc123");
});

test("withErrorSafety passes non-function properties through unchanged", () => {
  const provider = {
    apiBase: "https://cardano.blockfrost.io",
    async health(): Promise<string> {
      return "ok";
    }
  };

  const safeProvider = withErrorSafety(provider, {
    ctx: {
      source: "provider_query",
      stage: "submit"
    }
  });

  assert.equal(safeProvider.apiBase, "https://cardano.blockfrost.io");
});

test("withErrorSafety normalizes async errors and propagates context + method metadata", async () => {
  const provider = {
    async submitTx(): Promise<string> {
      throw {
        status_code: 429,
        error: "Too Many Requests",
        message: "Rate limited"
      };
    }
  };

  const safeProvider = withErrorSafety(provider, {
    ctx(method) {
      return {
        source: "provider_submit",
        stage: "submit",
        provider: "blockfrost",
        walletHint: `method:${method}`
      };
    }
  });

  await assert.rejects(
    () => safeProvider.submitTx(),
    (err: unknown) => {
      assert.equal(typeof err, "object");
      const normalized = err as {
        name: string;
        code: string;
        source: string;
        stage: string;
        provider?: string;
        wallet?: { name?: string };
        meta?: Record<string, unknown>;
      };
      assert.equal(normalized.name, "CardanoAppError");
      assert.equal(normalized.code, "RATE_LIMITED");
      assert.equal(normalized.source, "provider_submit");
      assert.equal(normalized.stage, "submit");
      assert.equal(normalized.provider, "blockfrost");
      assert.equal(normalized.wallet?.name, "method:submitTx");
      assert.equal(normalized.meta?.safeProviderWrapped, true);
      assert.equal(normalized.meta?.safeProviderMethod, "submitTx");
      return true;
    }
  );
});

test("withErrorSafety invokes onError callback with normalized error details", async () => {
  const provider = {
    async submitTx(tx: string): Promise<string> {
      throw new Error(`failed:${tx}`);
    }
  };

  let capturedMethod = "";
  let capturedCode = "";
  let capturedArg = "";

  const safeProvider = withErrorSafety(provider, {
    ctx: {
      source: "provider_submit",
      stage: "submit"
    },
    onError(normalized, details) {
      capturedMethod = details.method;
      capturedCode = normalized.code;
      capturedArg = String(details.args[0]);
    }
  });

  await assert.rejects(() => safeProvider.submitTx("tx1"));
  assert.equal(capturedMethod, "submitTx");
  assert.equal(capturedCode, "UNKNOWN");
  assert.equal(capturedArg, "tx1");
});
