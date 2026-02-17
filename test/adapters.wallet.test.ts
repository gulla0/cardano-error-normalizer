import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { fromWalletError } from "../src/adapters/wallet.ts";

interface FixtureRow {
  label: string;
  err: unknown;
}

const EXPECTED_CODE_BY_LABEL: Record<string, string> = {
  APIError_InvalidRequest: "WALLET_INVALID_REQUEST",
  APIError_InternalError: "WALLET_INTERNAL",
  APIError_Refused: "WALLET_REFUSED",
  APIError_AccountChange: "WALLET_ACCOUNT_CHANGED",
  TxSign_ProofGeneration: "WALLET_SIGN_PROOF_GENERATION",
  TxSign_UserDeclined: "WALLET_SIGN_USER_DECLINED",
  TxSign_DeprecatedCert: "TX_LEDGER_VALIDATION_FAILED",
  TxSend_Refused: "WALLET_SUBMIT_REFUSED",
  TxSend_Failure: "WALLET_SUBMIT_FAILURE"
};

test("fromWalletError maps fixture table deterministically", async () => {
  const fixturePath = new URL("./fixtures/wallet-errors.json", import.meta.url);
  const fixtureRows = JSON.parse(
    await readFile(fixturePath, "utf8")
  ) as FixtureRow[];

  for (const row of fixtureRows) {
    const adapted = fromWalletError(row.err);

    assert.ok(adapted, `expected mapping for ${row.label}`);
    assert.equal(adapted?.code, EXPECTED_CODE_BY_LABEL[row.label], row.label);
    assert.equal(adapted?.raw, row.err, `${row.label} preserves raw`);
    assert.equal(adapted?.message, (row.err as { info: string }).info, `${row.label} message`);
    assert.equal(
      (adapted?.meta as { walletCode?: number }).walletCode,
      (row.err as { code: number }).code,
      `${row.label} stores walletCode`
    );
  }
});

test("fromWalletError returns null for non-wallet error shape", () => {
  const adapted = fromWalletError({ status_code: 402, error: "Payment Required", message: "Daily limit" });
  assert.equal(adapted, null);
});

test("fromWalletError disambiguates overlapping positive codes by info", () => {
  const signRefused = fromWalletError({ code: 1, info: "ProofGeneration" });
  const submitRefused = fromWalletError({ code: 1, info: "Refused" });

  assert.equal(signRefused?.code, "WALLET_SIGN_PROOF_GENERATION");
  assert.equal(signRefused?.source, "wallet_sign");
  assert.equal(submitRefused?.code, "WALLET_SUBMIT_REFUSED");
  assert.equal(submitRefused?.source, "wallet_submit");
});

test("fromWalletError returns null for unknown wallet code/info combination", () => {
  const adapted = fromWalletError({ code: 9, info: "SomeFutureExtension" });
  assert.equal(adapted, null);
});
