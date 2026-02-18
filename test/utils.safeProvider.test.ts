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

test("withErrorSafety normalizes sync throws from wrapped methods", () => {
  const provider = {
    submitTx(): string {
      throw {
        status_code: 425,
        error: "Mempool Full",
        message: "Mempool is full"
      };
    }
  };

  const safeProvider = withErrorSafety(provider, {
    ctx: {
      source: "provider_submit",
      stage: "submit",
      provider: "blockfrost"
    }
  });

  assert.throws(
    () => safeProvider.submitTx(),
    (err: unknown) => {
      const normalized = err as {
        name: string;
        code: string;
        meta?: Record<string, unknown>;
      };

      assert.equal(normalized.name, "CardanoAppError");
      assert.equal(normalized.code, "MEMPOOL_FULL");
      assert.equal(normalized.meta?.safeProviderWrapped, true);
      assert.equal(normalized.meta?.safeProviderMethod, "submitTx");
      return true;
    }
  );
});

test("withErrorSafety accepts normalizerConfig when no custom normalizer is provided", async () => {
  const provider = {
    async submitTx(): Promise<string> {
      throw {
        message: "request timeout",
        trace: "line one\nline two"
      };
    }
  };

  const safeProvider = withErrorSafety(provider, {
    ctx: {
      source: "provider_submit",
      stage: "submit"
    },
    normalizerConfig: {
      parseTraces: true
    }
  });

  await assert.rejects(
    () => safeProvider.submitTx(),
    (err: unknown) => {
      const normalized = err as {
        code: string;
        resolution?: { title: string };
        meta?: Record<string, unknown>;
      };

      assert.equal(normalized.code, "TIMEOUT");
      assert.equal(normalized.resolution?.title, "Retry timed-out request");
      assert.deepEqual(normalized.meta?.traces, ["line one", "line two"]);
      return true;
    }
  );
});
