import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { fromBlockfrostError } from "../src/adapters/blockfrost.ts";

interface FixtureRow {
  label: string;
  err: unknown;
}

const EXPECTED_CODE_BY_LABEL: Record<string, string> = {
  "402_quota_exceeded": "QUOTA_EXCEEDED",
  "418_auto_banned": "FORBIDDEN",
  "425_mempool_full": "MEMPOOL_FULL",
  "429_rate_limited": "RATE_LIMITED"
};

test("fromBlockfrostError maps fixture table deterministically", async () => {
  const fixturePath = new URL("./fixtures/blockfrost-errors.json", import.meta.url);
  const fixtureRows = JSON.parse(
    await readFile(fixturePath, "utf8")
  ) as FixtureRow[];

  for (const row of fixtureRows) {
    const adapted = fromBlockfrostError(row.err);

    assert.ok(adapted, `expected mapping for ${row.label}`);
    assert.equal(adapted?.code, EXPECTED_CODE_BY_LABEL[row.label], row.label);
    assert.equal(adapted?.provider, "blockfrost");
    assert.equal(adapted?.raw, row.err, `${row.label} preserves raw`);
  }

  const quota = fromBlockfrostError(fixtureRows[0]?.err);
  const banned = fromBlockfrostError(fixtureRows[1]?.err);
  const mempool = fromBlockfrostError(fixtureRows[2]?.err);

  assert.equal((quota?.meta as { blockfrostReason?: string }).blockfrostReason, "daily_limit");
  assert.equal((banned?.meta as { blockfrostReason?: string }).blockfrostReason, "auto_banned");
  assert.equal((mempool?.meta as { blockfrostReason?: string }).blockfrostReason, "mempool_full");
});

test("fromBlockfrostError maps generic 4xx/5xx status ranges", () => {
  const generic4xx = fromBlockfrostError({ status_code: 422, error: "Unprocessable Entity", message: "bad" });
  const generic5xx = fromBlockfrostError({ status_code: 503, error: "Service Unavailable", message: "down" });

  assert.equal(generic4xx?.code, "BAD_REQUEST");
  assert.equal(generic5xx?.code, "PROVIDER_INTERNAL");
});

test("fromBlockfrostError accepts key-order agnostic payloads from nested response.data", () => {
  const wrapped = {
    response: {
      data: {
        message: "Rate limited.",
        status_code: 429,
        error: "Too Many Requests"
      }
    }
  };

  const adapted = fromBlockfrostError(wrapped);

  assert.equal(adapted?.code, "RATE_LIMITED");
});
