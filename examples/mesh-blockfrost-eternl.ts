import { createNormalizer } from "../src/index.ts";

const normalizer = createNormalizer({ includeFingerprint: true });

function submitTransactionWithMesh(): never {
  // Simulated wrapped provider error shape from a Mesh stack.
  throw {
    message: "Mesh submit failed",
    cause: {
      response: {
        data: {
          status_code: 402,
          error: "Project Over Limit",
          message: "Daily request limit has been exceeded"
        }
      }
    }
  };
}

async function runDemo(): Promise<void> {
  try {
    submitTransactionWithMesh();
  } catch (err) {
    const normalized = normalizer.normalize(err, {
      source: "provider_submit",
      stage: "submit",
      network: "preprod",
      provider: "blockfrost",
      walletHint: "eternl"
    });

    console.log("code:", normalized.code);
    console.log("message:", normalized.message);
    console.log("fingerprint:", normalized.fingerprint);
    console.log("meta:", normalized.meta);
  }
}

runDemo().catch((err: unknown) => {
  console.error("Unexpected demo failure", err);
});
