import assert from "node:assert/strict";
import test from "node:test";

import { isCardanoAppError } from "../src/utils/guards.ts";

test("isCardanoAppError returns true for normalized error shape", () => {
  const candidate = {
    name: "CardanoAppError" as const,
    source: "provider_submit" as const,
    stage: "submit" as const,
    code: "UNKNOWN" as const,
    severity: "error" as const,
    message: "failed",
    timestamp: new Date().toISOString(),
    raw: { some: "raw" },
    originalError: { some: "raw" }
  };

  assert.equal(isCardanoAppError(candidate), true);
});

test("isCardanoAppError returns false for non-normalized errors", () => {
  assert.equal(isCardanoAppError(new Error("nope")), false);
  assert.equal(
    isCardanoAppError({
      name: "Error",
      message: "failed"
    }),
    false
  );
});
