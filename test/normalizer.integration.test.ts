import test from "node:test";
import assert from "node:assert/strict";

import { createNormalizer } from "../src/normalizer.ts";

test("default adapter order unwraps mesh errors before node heuristics", () => {
  const normalizer = createNormalizer();
  const wrapped = {
    message: "ApplyTxError: BadInputsUTxO while submitting transaction",
    cause: {
      response: {
        data: {
          status_code: 402,
          error: "Payment Required",
          message: "Project daily request limit reached."
        }
      }
    }
  };

  const result = normalizer.normalize(wrapped, {
    source: "provider_submit",
    stage: "submit",
    provider: "mesh"
  });

  assert.equal(result.code, "QUOTA_EXCEEDED");
  assert.equal(result.provider, "blockfrost");
  assert.equal((result.meta as { meshUnwrapped?: boolean }).meshUnwrapped, true);
});

test("default adapter order prefers wallet mapping over blockfrost when both shapes exist", () => {
  const normalizer = createNormalizer();
  const ambiguous = {
    code: -2,
    info: "InternalError",
    status_code: 429,
    error: "Too Many Requests",
    message: "Rate limited"
  };

  const result = normalizer.normalize(ambiguous, {
    source: "wallet_sign",
    stage: "sign"
  });

  assert.equal(result.code, "WALLET_INTERNAL");
  assert.equal(result.source, "wallet_sign");
  assert.equal(result.stage, "sign");
});

test("wallet API -2 maps to submit failure when submit context is provided", () => {
  const normalizer = createNormalizer();
  const payload = {
    code: -2,
    info: "unknown error submitTx"
  };

  const result = normalizer.normalize(payload, {
    source: "wallet_submit",
    stage: "submit"
  });

  assert.equal(result.code, "WALLET_SUBMIT_FAILURE");
  assert.equal(result.source, "wallet_submit");
  assert.equal(result.stage, "submit");
});
