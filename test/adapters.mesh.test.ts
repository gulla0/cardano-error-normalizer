import test from "node:test";
import assert from "node:assert/strict";

import { fromMeshError } from "../src/adapters/mesh.ts";

test("fromMeshError unwraps nested Blockfrost payloads before fallback mappings", () => {
  const wrapped = {
    name: "MeshTxBuilderError",
    cause: {
      response: {
        data: {
          status_code: 402,
          error: "Payment Required",
          message: "Project daily request limit reached."
        }
      }
    }
  };

  const adapted = fromMeshError(wrapped, {
    source: "provider_submit",
    stage: "submit"
  });

  assert.equal(adapted?.code, "QUOTA_EXCEEDED");
  assert.equal(adapted?.raw, wrapped);
  assert.equal((adapted?.meta as { meshUnwrapped?: boolean }).meshUnwrapped, true);
});

test("fromMeshError unwraps nested wallet payloads", () => {
  const wrapped = {
    message: "Mesh submit failed",
    error: {
      cause: {
        code: 2,
        info: "UserDeclined"
      }
    }
  };

  const adapted = fromMeshError(wrapped, {
    source: "wallet_submit",
    stage: "submit"
  });

  assert.equal(adapted?.code, "WALLET_SIGN_USER_DECLINED");
  assert.equal(adapted?.raw, wrapped);
  assert.equal((adapted?.meta as { meshUnwrapped?: boolean }).meshUnwrapped, true);
});

test("fromMeshError returns null when no nested mapping target exists", () => {
  const adapted = fromMeshError(
    { message: "mesh wrapper with opaque payload", details: { foo: "bar" } },
    {
      source: "mesh_build",
      stage: "build"
    }
  );

  assert.equal(adapted, null);
});
