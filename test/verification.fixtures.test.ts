import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { fromBlockfrostError } from "../src/adapters/blockfrost.ts";
import { fromMeshError } from "../src/adapters/mesh.ts";
import { fromNodeStringError } from "../src/adapters/node-string.ts";
import { fromWalletError } from "../src/adapters/wallet.ts";
import { inferErrorMeta } from "../src/core/analyzers.ts";
import type { NormalizeContext } from "../src/types.ts";

interface FixtureRow {
  label: string;
  err: unknown;
  expectedCode: string;
  expectedMeta: Record<string, unknown>;
  ctx?: Partial<NormalizeContext>;
}

async function readFixture(name: string): Promise<FixtureRow[]> {
  const fixturePath = new URL(`./fixtures/verification/${name}.json`, import.meta.url);
  return JSON.parse(await readFile(fixturePath, "utf8")) as FixtureRow[];
}

test("verification fixtures: Blockfrost mappings are key-based and meta-inferred", async () => {
  const rows = await readFixture("blockfrost");

  for (const row of rows) {
    const adapted = fromBlockfrostError(row.err);

    assert.ok(adapted, `expected mapping for ${row.label}`);
    assert.equal(adapted?.code, row.expectedCode, row.label);

    const inferred = inferErrorMeta(row.err);
    assert.deepEqual(inferred, row.expectedMeta, `${row.label} inferErrorMeta`);
  }
});

test("verification fixtures: wallet families map deterministically", async () => {
  const rows = await readFixture("wallet");

  for (const row of rows) {
    const adapted = fromWalletError(row.err, row.ctx as NormalizeContext | undefined);

    assert.ok(adapted, `expected mapping for ${row.label}`);
    assert.equal(adapted?.code, row.expectedCode, row.label);

    const inferred = inferErrorMeta(row.err);
    assert.deepEqual(inferred, row.expectedMeta, `${row.label} inferErrorMeta`);

    if (row.label === "WALLET_CIP95_DEPRECATED_CERT") {
      assert.equal(
        (adapted?.meta as { cip95DeprecatedCertificate?: boolean }).cip95DeprecatedCertificate,
        true
      );
    }

    if (row.label === "WALLET_PAGINATE_OUT_OF_RANGE") {
      assert.equal((adapted?.meta as { walletPaginateMaxSize?: number }).walletPaginateMaxSize, 100);
    }
  }
});

test("verification fixtures: node string heuristics map to conservative code buckets", async () => {
  const rows = await readFixture("nodeStrings");

  for (const row of rows) {
    const adapted = fromNodeStringError(row.err);

    assert.ok(adapted, `expected mapping for ${row.label}`);
    assert.equal(adapted?.code, row.expectedCode, row.label);

    const inferred = inferErrorMeta(row.err);
    assert.deepEqual(inferred, row.expectedMeta, `${row.label} inferErrorMeta`);
  }
});

test("verification fixtures: mesh wrappers unwrap nested payloads before fallback", async () => {
  const rows = await readFixture("mesh");

  for (const row of rows) {
    const adapted = fromMeshError(row.err, {
      source: row.ctx?.source ?? "provider_submit",
      stage: row.ctx?.stage ?? "submit"
    } as NormalizeContext);

    assert.ok(adapted, `expected mapping for ${row.label}`);
    assert.equal(adapted?.code, row.expectedCode, row.label);
    assert.equal((adapted?.meta as { meshUnwrapped?: boolean }).meshUnwrapped, true, row.label);

    const inferred = inferErrorMeta(row.err);
    assert.deepEqual(inferred, row.expectedMeta, `${row.label} inferErrorMeta`);
  }
});
