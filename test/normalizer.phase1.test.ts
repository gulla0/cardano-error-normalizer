import test from "node:test";
import assert from "node:assert/strict";

import { createNormalizer } from "../src/normalizer.ts";

test("normalize fallback returns valid CardanoAppError with preserved raw", () => {
  const normalizer = createNormalizer();
  const raw = { any: "shape" };

  const result = normalizer.normalize(raw, {
    source: "provider_submit",
    stage: "submit",
    provider: "blockfrost",
    walletHint: "eternl",
    network: "preprod",
    txHash: "abc123",
    timestamp: "2026-02-17T12:00:00.000Z"
  });

  assert.equal(result.name, "CardanoAppError");
  assert.equal(result.code, "UNKNOWN");
  assert.equal(result.severity, "error");
  assert.equal(result.source, "provider_submit");
  assert.equal(result.stage, "submit");
  assert.equal(result.provider, "blockfrost");
  assert.equal(result.network, "preprod");
  assert.equal(result.wallet?.name, "eternl");
  assert.equal(result.txHash, "abc123");
  assert.equal(result.timestamp, "2026-02-17T12:00:00.000Z");
  assert.equal(result.raw, raw);
  assert.equal(result.originalError, raw);
});

test("normalizer executes adapters in order and stops on first match", () => {
  const callOrder: string[] = [];
  const normalizer = createNormalizer({
    adapters: [
      () => {
        callOrder.push("first");
        return null;
      },
      () => {
        callOrder.push("second");
        return {
          code: "BAD_REQUEST",
          message: "matched by second",
          severity: "warn"
        };
      },
      () => {
        callOrder.push("third");
        return {
          code: "UNKNOWN",
          message: "should not run"
        };
      }
    ]
  });

  const result = normalizer.normalize("error", {
    source: "provider_query",
    stage: "submit"
  });

  assert.deepEqual(callOrder, ["first", "second"]);
  assert.equal(result.code, "BAD_REQUEST");
  assert.equal(result.message, "matched by second");
  assert.equal(result.severity, "warn");
});

test("includeFingerprint adds deterministic fingerprint from normalized tuple", () => {
  const normalizer = createNormalizer({
    includeFingerprint: true,
    adapters: [
      () => ({
        code: "QUOTA_EXCEEDED",
        message: "quota",
        provider: "blockfrost"
      })
    ]
  });

  const ctx = { source: "provider_query" as const, stage: "submit" as const };
  const first = normalizer.normalize(new Error("x"), ctx);
  const second = normalizer.normalize(new Error("y"), ctx);

  assert.match(first.fingerprint ?? "", /^[a-f0-9]{16}$/);
  assert.equal(first.fingerprint, second.fingerprint);
});

test("normalizer preserves adapter resolution details when provided", () => {
  const normalizer = createNormalizer({
    adapters: [
      () => ({
        code: "WALLET_REFUSED",
        message: "wallet refused request",
        resolution: {
          title: "Reconnect wallet",
          steps: ["Reconnect wallet extension", "Retry the action"],
          docsUrl: "https://example.com/docs/wallet-refused"
        }
      })
    ]
  });

  const result = normalizer.normalize(new Error("refused"), {
    source: "wallet_sign",
    stage: "sign"
  });

  assert.equal(result.resolution?.title, "Reconnect wallet");
  assert.deepEqual(result.resolution?.steps, [
    "Reconnect wallet extension",
    "Retry the action"
  ]);
  assert.equal(result.resolution?.docsUrl, "https://example.com/docs/wallet-refused");
});
