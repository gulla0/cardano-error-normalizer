import assert from "node:assert/strict";
import test from "node:test";

import { createSmartNormalizer } from "../src/core/normalize.ts";

test("createSmartNormalizer attaches resolution hints for mapped codes", () => {
  const normalizer = createSmartNormalizer();

  const normalized = normalizer.normalize(
    {
      status_code: 402,
      error: "Project Over Limit",
      message: "Daily request limit has been exceeded"
    },
    {
      source: "provider_submit",
      stage: "submit"
    }
  );

  assert.equal(normalized.code, "QUOTA_EXCEEDED");
  assert.equal(normalized.resolution?.title, "Increase or reset provider quota");
  assert.equal(normalized.resolution?.steps.length, 3);
});

test("createSmartNormalizer uses message matcher strategy when adapters return UNKNOWN", () => {
  const normalizer = createSmartNormalizer();

  const normalized = normalizer.normalize(new Error("Request timed out after 30s"), {
    source: "provider_query",
    stage: "build"
  });

  assert.equal(normalized.code, "TIMEOUT");
  assert.equal(normalized.meta?.smartMatcher, "timeout");
  assert.equal(normalized.resolution?.title, "Retry timed-out request");
});

test("createSmartNormalizer preserves adapter-provided resolution when present", () => {
  const normalizer = createSmartNormalizer({
    adapters: [
      () => ({
        code: "WALLET_REFUSED",
        message: "wallet refused",
        resolution: {
          title: "Use adapter resolution",
          steps: ["step 1", "step 2"]
        }
      })
    ]
  });

  const normalized = normalizer.normalize(new Error("refused"), {
    source: "wallet_sign",
    stage: "sign"
  });

  assert.equal(normalized.code, "WALLET_REFUSED");
  assert.equal(normalized.resolution?.title, "Use adapter resolution");
  assert.deepEqual(normalized.resolution?.steps, ["step 1", "step 2"]);
});

test("createSmartNormalizer debug mode never throws when console group logging fails", () => {
  const originalGroupCollapsed = console.groupCollapsed;
  const originalGroupEnd = console.groupEnd;

  console.groupCollapsed = () => {
    throw new Error("group log failed");
  };
  console.groupEnd = undefined;

  try {
    const normalizer = createSmartNormalizer({ debug: true });
    assert.doesNotThrow(() =>
      normalizer.normalize(new Error("boom"), {
        source: "provider_query",
        stage: "build"
      })
    );
  } finally {
    console.groupCollapsed = originalGroupCollapsed;
    console.groupEnd = originalGroupEnd;
  }
});
