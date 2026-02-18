import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createNormalizer } from "../src/normalizer.ts";
import type { NormalizeContext, CardanoAppError } from "../src/types.ts";

interface RealWorldFixtureRow {
  id: string;
  ctx: NormalizeContext;
  err: unknown;
  expectedCode: CardanoAppError["code"];
}

test("real-world payload fixtures normalize to stable codes", async () => {
  const fixturePath = new URL("./fixtures/real-world-errors.json", import.meta.url);
  const rows = JSON.parse(await readFile(fixturePath, "utf8")) as RealWorldFixtureRow[];
  const normalizer = createNormalizer();

  assert.ok(rows.length >= 5, "expected at least five real-world fixtures");

  for (const row of rows) {
    const normalized = normalizer.normalize(row.err, row.ctx);

    assert.equal(normalized.code, row.expectedCode, row.id);
    assert.equal(normalized.raw, row.err, `${row.id} preserves raw payload`);
  }
});

