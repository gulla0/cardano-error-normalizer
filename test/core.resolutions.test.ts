import test from "node:test";
import assert from "node:assert/strict";

import { getResolutionForCode } from "../src/core/resolutions.ts";

test("getResolutionForCode returns expected title and steps for mapped code", () => {
  const resolution = getResolutionForCode("QUOTA_EXCEEDED");

  assert.equal(resolution?.title, "Increase or reset provider quota");
  assert.deepEqual(resolution?.steps, [
    "Check current Blockfrost project usage",
    "Switch project key or upgrade quota plan",
    "Retry once quota has reset"
  ]);
  assert.equal(resolution?.docsUrl, "https://blockfrost.dev/start-building/errors");
});

test("getResolutionForCode returns defensive step array copy", () => {
  const first = getResolutionForCode("WALLET_REFUSED");
  assert.ok(first);

  first.steps.push("mutated");

  const second = getResolutionForCode("WALLET_REFUSED");
  assert.ok(second);
  assert.deepEqual(second.steps, [
    "Prompt user to reconnect or re-enable wallet permissions",
    "Retry operation after wallet confirmation"
  ]);
});

