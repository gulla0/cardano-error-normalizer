import assert from "node:assert/strict";
import test from "node:test";

import { inferErrorMeta } from "../src/core/analyzers.ts";

test("inferErrorMeta detects Blockfrost status from nested key-based payloads", () => {
  const inferred = inferErrorMeta({
    response: {
      data: {
        error: "Project Over Limit",
        message: "Daily request limit exceeded",
        status_code: 402
      }
    }
  });

  assert.equal(inferred.inferredProvider, "blockfrost");
  assert.equal(inferred.inferredKind, "blockfrost_http");
  assert.equal(inferred.httpStatus, 402);
  assert.equal(inferred.blockfrostReason, "daily_limit");
});

test("inferErrorMeta detects CIP numeric wallet error shapes", () => {
  const inferred = inferErrorMeta({
    cause: {
      code: -3,
      info: "Refused"
    }
  });

  assert.equal(inferred.inferredProvider, "wallet");
  assert.equal(inferred.inferredKind, "wallet_cip_numeric");
});

test("inferErrorMeta detects node ledger string patterns", () => {
  const inferred = inferErrorMeta(
    "ShelleyTxValidationError (ApplyTxError [UtxowFailure (BadInputsUTxO ...)])"
  );

  assert.equal(inferred.inferredProvider, "cardano-node");
  assert.equal(inferred.inferredKind, "node_ledger_string");
});

test("inferErrorMeta detects network connectivity failure strings", () => {
  const inferred = inferErrorMeta("Status: No connection");

  assert.equal(inferred.inferredProvider, "network");
  assert.equal(inferred.inferredKind, "connectivity_unreachable");
});
