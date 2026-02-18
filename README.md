# Cardano Error Normalizer (MVP)

A small TypeScript library that normalizes heterogeneous Cardano stack errors into a stable `CardanoAppError` shape.

## Install

```bash
npm install @gulla0/cardano-error-normalizer
```

## Quickstart

```ts
import { createNormalizer } from "@gulla0/cardano-error-normalizer";

const normalizer = createNormalizer({ includeFingerprint: true });

try {
  // Simulated wrapped provider error from a Mesh + Blockfrost flow.
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
} catch (err) {
  const normalized = normalizer.normalize(err, {
    source: "provider_submit",
    stage: "submit",
    network: "preprod",
    provider: "blockfrost",
    walletHint: "eternl"
  });

  console.log(normalized.code); // QUOTA_EXCEEDED
  console.log(normalized.meta); // includes blockfrostReason + meshUnwrapped
}
```

## DX-First Integration Path

Use the package in this order to reduce callsite boilerplate:

1. `withErrorSafety(...)` for provider/wallet objects so async method failures are normalized automatically.
2. `normalizeError(...)` or `globalNormalizer.normalize(...)` for one-off/manual boundaries.
3. `useCardanoError(...)` from `@gulla0/cardano-error-normalizer/react` for UI operation state in React apps.

### Provider/Wallet Wrapper (Recommended)

```ts
import { withErrorSafety } from "@gulla0/cardano-error-normalizer";

const safeProvider = withErrorSafety(rawProvider, {
  ctx: (method) => ({
    source: method === "submitTx" ? "provider_submit" : "provider_query",
    stage: method === "submitTx" ? "submit" : "build",
    provider: "blockfrost",
    network: "preprod"
  }),
  onError(normalized, details) {
    console.error("normalized provider error", {
      method: details.method,
      code: normalized.code,
      meta: normalized.meta
    });
  }
});

await safeProvider.submitTx(txCborHex);
```

`withErrorSafety` rethrows `CardanoAppError` and annotates `meta.safeProviderWrapped=true` and `meta.safeProviderMethod`.

### Debug + Trace Enrichment

Enable debug telemetry and trace extraction without changing your callsites:

```ts
import { withErrorSafety } from "@gulla0/cardano-error-normalizer";

const safeProvider = withErrorSafety(rawProvider, {
  ctx: { source: "provider_submit", stage: "submit", provider: "blockfrost" },
  normalizerConfig: {
    debug: true,
    parseTraces: true
  }
});
```

`debug` writes guarded console diagnostics, and `parseTraces` adds trimmed trace lines to `normalized.meta.traces` when present.

### React Hook Entrypoint (Optional)

The core package stays framework-agnostic. React usage is available from the `./react` subpath:

```ts
import { useCallback, useState } from "react";
import { useCardanoError } from "@gulla0/cardano-error-normalizer/react";

export function useSubmitTx(submitTx: (cborHex: string) => Promise<string>) {
  return useCardanoError({
    bindings: { useState, useCallback },
    operation: submitTx,
    ctx: {
      source: "provider_submit",
      stage: "submit",
      provider: "blockfrost",
      network: "preprod"
    },
    normalizerConfig: {
      parseTraces: true
    }
  });
}
```

The hook provides `loading`, `data`, `error`, `run`, and `reset`, and rethrows normalized `CardanoAppError` from `run(...)`.

## Migration: Manual try/catch -> Wrapper/Helper

Before:

```ts
try {
  const txHash = await provider.submitTx(txCborHex);
  return txHash;
} catch (err) {
  const normalized = normalizer.normalize(err, {
    source: "provider_submit",
    stage: "submit",
    provider: "blockfrost",
    network: "preprod"
  });
  logger.error({ code: normalized.code, raw: normalized.raw });
  throw normalized;
}
```

After:

```ts
const safeProvider = withErrorSafety(provider, {
  ctx: {
    source: "provider_submit",
    stage: "submit",
    provider: "blockfrost",
    network: "preprod"
  }
});

const txHash = await safeProvider.submitTx(txCborHex);
```

For non-proxy boundaries:

```ts
import { normalizeError } from "@gulla0/cardano-error-normalizer";

try {
  await doWork();
} catch (err) {
  throw normalizeError(err, { source: "provider_query", stage: "build" });
}
```

### Rendering Actionable Resolution Hints

Every normalized error can include `resolution` guidance:

```ts
import type { CardanoAppError } from "@gulla0/cardano-error-normalizer";

try {
  await safeProvider.submitTx(txCborHex);
} catch (err) {
  const normalized = err as CardanoAppError;
  const title = normalized.resolution?.title ?? "Troubleshoot transaction failure";
  const steps = normalized.resolution?.steps ?? ["Inspect logs and retry"];

  renderHintCard({ title, steps });
}
```

Run tests:

```bash
npm test
```

Type-check and build:

```bash
npm run typecheck
npm run build
```

## Default Adapter Order

`createNormalizer()` runs adapters in this order:

1. `fromMeshError` (unwrap nested errors first)
2. `fromWalletError`
3. `fromBlockfrostError`
4. `fromNodeStringError`
5. fallback to `UNKNOWN`

## Wallet Mapping Table (CIP-30/CIP-95)

| Wallet error family | Numeric `code` | Meaning | `CardanoErrorCode` |
| --- | ---: | --- | --- |
| APIError | `-1` | InvalidRequest | `WALLET_INVALID_REQUEST` |
| APIError | `-2` | InternalError | `WALLET_INTERNAL` |
| APIError | `-3` | Refused | `WALLET_REFUSED` |
| APIError | `-4` | AccountChange | `WALLET_ACCOUNT_CHANGED` |
| TxSignError | `1` | ProofGeneration | `WALLET_SIGN_PROOF_GENERATION` |
| TxSignError | `2` | UserDeclined | `WALLET_SIGN_USER_DECLINED` |
| TxSignError (CIP-95 ext) | `3` | DeprecatedCertificate | `TX_LEDGER_VALIDATION_FAILED` |
| TxSendError | `1` | Refused | `WALLET_SUBMIT_REFUSED` |
| TxSendError | `2` | Failure | `WALLET_SUBMIT_FAILURE` |

## Blockfrost Mapping Table

| HTTP status | Meaning | `CardanoErrorCode` | Notes (`meta`) |
| ---: | --- | --- | --- |
| `400` | invalid request | `BAD_REQUEST` |  |
| `402` | daily request limit exceeded | `QUOTA_EXCEEDED` | `blockfrostReason="daily_limit"` |
| `403` | not authenticated | `UNAUTHORIZED` |  |
| `404` | resource does not exist | `NOT_FOUND` |  |
| `418` | auto-banned after flooding | `FORBIDDEN` | `blockfrostReason="auto_banned"` |
| `425` | mempool full | `MEMPOOL_FULL` | `blockfrostReason="mempool_full"` |
| `429` | rate limited | `RATE_LIMITED` |  |
| `5xx` | server side error | `PROVIDER_INTERNAL` |  |
| other `4xx` | other client error | `BAD_REQUEST` | preserve `raw` |

## Node String Heuristics

- `/DeserialiseFailure|DecoderFailure|expected word/i` -> `TX_DESERIALISE_FAILURE`
- `/BadInputsUTxO/i` -> `TX_INPUTS_MISSING_OR_SPENT`
- `/OutputTooSmallUTxO|BabbageOutputTooSmallUTxO/i` -> `TX_OUTPUT_TOO_SMALL`
- `/ValueNotConservedUTxO/i` -> `TX_VALUE_NOT_CONSERVED`
- `/ScriptFailure|PlutusFailure|EvaluationFailure|ValidationTagMismatch|redeemer.*execution units/i` -> `TX_SCRIPT_EVALUATION_FAILED`
- `/ShelleyTxValidationError|ApplyTxError/i` -> `TX_LEDGER_VALIDATION_FAILED` when no inner specific tag is found

## Example

See `/examples/mesh-blockfrost-eternl.ts` for an end-to-end Mesh + Blockfrost + Eternl flow.
