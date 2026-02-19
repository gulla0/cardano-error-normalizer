import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createSmartNormalizer } from "../src/core/normalize.ts";
import type { NormalizeContext, CardanoAppError } from "../src/types.ts";

interface RealWorldFixtureRow {
  id: string;
  observedAt: string;
  capturedFrom: string;
  ctx: NormalizeContext;
  err: unknown;
  expectedCode: CardanoAppError["code"];
}

test("real-world payload fixtures normalize to stable codes", async () => {
  const fixturePath = new URL("./fixtures/real-world-errors.json", import.meta.url);
  const rows = JSON.parse(await readFile(fixturePath, "utf8")) as RealWorldFixtureRow[];
  const normalizer = createSmartNormalizer();
  const seenIds = new Set<string>();

  assert.ok(rows.length >= 5, "expected at least five real-world fixtures");

  for (const row of rows) {
    assert.ok(!seenIds.has(row.id), `${row.id} fixture id must be unique`);
    seenIds.add(row.id);

    assert.match(row.observedAt, /^\d{4}-\d{2}-\d{2}$/, `${row.id} observedAt must be YYYY-MM-DD`);
    assert.ok(row.capturedFrom.length > 0, `${row.id} capturedFrom is required`);

    const normalized = normalizer.normalize(row.err, row.ctx);

    assert.equal(normalized.code, row.expectedCode, row.id);
    assert.equal(normalized.raw, row.err, `${row.id} preserves raw payload`);
  }
});
