import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { fromNodeStringError } from "../src/adapters/node-string.ts";

test("fromNodeStringError maps node fixture lines to expected codes", async () => {
  const fixturePath = new URL("./fixtures/node-errors.txt", import.meta.url);
  const fixtureText = await readFile(fixturePath, "utf8");
  const lines = fixtureText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const expected = [
    "TX_DESERIALISE_FAILURE",
    "TX_INPUTS_MISSING_OR_SPENT",
    "TX_VALUE_NOT_CONSERVED",
    "TX_OUTPUT_TOO_SMALL"
  ];

  assert.equal(lines.length, expected.length);

  for (let index = 0; index < lines.length; index += 1) {
    const adapted = fromNodeStringError(lines[index]);

    assert.ok(adapted, `expected mapping for fixture line ${index + 1}`);
    assert.equal(adapted?.code, expected[index]);
    assert.equal(adapted?.source, "node_submit");
    assert.equal(adapted?.stage, "submit");
    assert.equal(adapted?.raw, lines[index]);
  }
});

test("fromNodeStringError maps wrapper-only error to ledger validation fallback", () => {
  const message = "Error while submitting tx: ShelleyTxValidationError (ApplyTxError [LedgerFailure (...)] )";
  const adapted = fromNodeStringError(message);

  assert.equal(adapted?.code, "TX_LEDGER_VALIDATION_FAILED");
});

test("fromNodeStringError maps script execution patterns", () => {
  const message = "ApplyTxError: PlutusFailure (EvaluationFailure) due to redeemer execution units";
  const adapted = fromNodeStringError(message);

  assert.equal(adapted?.code, "TX_SCRIPT_EVALUATION_FAILED");
});

test("fromNodeStringError returns null for non-text-like unknown shape", () => {
  const adapted = fromNodeStringError({ foo: "bar" });
  assert.equal(adapted, null);
});
