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

test("createSmartNormalizer covers remaining matcher branches for network, rate, and quota", () => {
  const normalizer = createSmartNormalizer();

  const network = normalizer.normalize(new Error("failed to fetch endpoint"), {
    source: "provider_query",
    stage: "build"
  });
  assert.equal(network.code, "NETWORK_UNREACHABLE");
  assert.equal(network.meta?.smartMatcher, "network_unreachable");

  const rate = normalizer.normalize(new Error("too many requests from client"), {
    source: "provider_query",
    stage: "build"
  });
  assert.equal(rate.code, "RATE_LIMITED");
  assert.equal(rate.meta?.smartMatcher, "rate_limited");

  const quota = normalizer.normalize(new Error("daily request limit reached"), {
    source: "provider_query",
    stage: "build"
  });
  assert.equal(quota.code, "QUOTA_EXCEEDED");
  assert.equal(quota.meta?.smartMatcher, "quota_exceeded");
});

test("createSmartNormalizer parseTraces trims, merges, and caps trace lines", () => {
  const normalizer = createSmartNormalizer({ parseTraces: true });

  const normalized = normalizer.normalize(
    {
      message: "request timeout",
      trace: " t1 \n \n t2 ",
      traces: [" t3 ", " ", "t4"],
      stack: "t5\nt6\nt7\nt8\nt9\nt10\nt11",
      data: { trace: "t12", traces: ["t13"] }
    },
    {
      source: "provider_submit",
      stage: "submit"
    }
  );

  assert.equal(normalized.code, "TIMEOUT");
  assert.deepEqual(normalized.meta?.traces, [
    "t1",
    "t2",
    "t3",
    "t4",
    "t5",
    "t6",
    "t7",
    "t8",
    "t9",
    "t10"
  ]);
});

test("createSmartNormalizer debug mode tolerates fallback to console.group", () => {
  const originalGroupCollapsed = console.groupCollapsed;
  const originalGroup = console.group;
  const originalDebug = console.debug;
  const originalGroupEnd = console.groupEnd;

  let usedGroup = false;
  console.groupCollapsed = undefined;
  console.group = () => {
    usedGroup = true;
  };
  console.debug = () => {
    throw new Error("debug failed");
  };
  console.groupEnd = () => {};

  try {
    const normalizer = createSmartNormalizer({ debug: true });
    assert.doesNotThrow(() =>
      normalizer.normalize(new Error("boom"), {
        source: "provider_query",
        stage: "build"
      })
    );
    assert.equal(usedGroup, true);
  } finally {
    console.groupCollapsed = originalGroupCollapsed;
    console.group = originalGroup;
    console.debug = originalDebug;
    console.groupEnd = originalGroupEnd;
  }
});
