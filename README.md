# Cardano Error Normalizer

A small TypeScript library that normalizes heterogeneous Cardano stack errors into a stable `CardanoAppError` shape.

Current package version in this repository: `0.3.0`.

## Install

```bash
npm install @gulla0/cardano-error-normalizer
```

## Quickstart (Recommended: Preset + Wrapper)

Use wrapper presets first so context is mostly automatic.

```ts
import {
  cip30WalletPreset,
  isCardanoAppError,
  meshProviderPreset
} from "@gulla0/cardano-error-normalizer";

const safeMeshProvider = meshProviderPreset(rawMeshProvider, {
  provider: "blockfrost"
});

const safeWalletApi = cip30WalletPreset(rawWalletApi, {
  walletHint: "eternl"
});

try {
  await safeMeshProvider.submitTx(txCborHex);
} catch (err) {
  if (isCardanoAppError(err)) {
    console.error(err.code, err.resolution?.steps);
    throw err;
  }

  throw err;
}
```

## What You Get (`CardanoAppError`)

`walletHint` from context maps to `error.wallet?.name` unless an adapter provides a richer wallet object.

```json
{
  "name": "CardanoAppError",
  "source": "provider_submit",
  "stage": "submit",
  "code": "QUOTA_EXCEEDED",
  "severity": "warn",
  "message": "Daily request limit has been exceeded",
  "timestamp": "2026-02-19T12:00:00.000Z",
  "network": "preprod",
  "provider": "blockfrost",
  "wallet": { "name": "eternl" },
  "resolution": {
    "title": "Upgrade or wait for quota reset",
    "steps": ["Verify project quota", "Retry after reset window"]
  },
  "meta": {
    "blockfrostReason": "daily_limit",
    "safeProviderWrapped": true,
    "safeProviderMethod": "submitTx"
  }
}
```

## Canonical Integration Path

1. `meshProviderPreset(...)` / `cip30WalletPreset(...)`
2. `withErrorSafety(...)` for non-preset objects
3. `createNormalizer({ defaults })` for manual boundaries
4. `@gulla0/cardano-error-normalizer/react` for React operations

## Wrapper-First Usage

### Preset Helpers (Preferred)

```ts
import {
  cip30WalletPreset,
  meshProviderPreset
} from "@gulla0/cardano-error-normalizer";

const safeMeshProvider = meshProviderPreset(rawMeshProvider, {
  provider: "blockfrost",
  network: "preprod"
});

const safeWalletApi = cip30WalletPreset(rawWalletApi, {
  walletHint: "eternl",
  network: "preprod"
});
```

`meshProviderPreset` maps provider methods (for example `submitTx`, `fetchAddressUTxOs`) to provider context. `cip30WalletPreset` maps CIP-30 wallet methods (for example `getUtxos`, `signTx`, `submitTx`) to wallet context.

### Generic Wrapper

```ts
import { withErrorSafety } from "@gulla0/cardano-error-normalizer";

const safeProvider = withErrorSafety(rawProvider, {
  ctx: {
    source: "provider_submit",
    stage: "submit",
    provider: "blockfrost",
    network: "preprod"
  },
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

### Advanced: Dynamic `ctx(method)`

```ts
import { withErrorSafety } from "@gulla0/cardano-error-normalizer";

const safeProvider = withErrorSafety(rawProvider, {
  ctx: (method) => ({
    source: method === "submitTx" ? "provider_submit" : "provider_query",
    stage: method === "submitTx" ? "submit" : "build",
    provider: "blockfrost",
    network: "preprod"
  })
});
```

Use this only when presets are not suitable.

## Manual Boundary Usage

```ts
import { createNormalizer } from "@gulla0/cardano-error-normalizer";

const normalizer = createNormalizer({
  config: { includeFingerprint: true },
  defaults: {
    source: "provider_submit",
    stage: "submit",
    provider: "blockfrost",
    network: "preprod"
  }
});

try {
  await provider.submitTx(txCborHex);
} catch (err) {
  throw normalizer.normalize(err, { walletHint: "eternl" });
}
```

## React Usage

Use the React subpath with explicit hook bindings from React:

```ts
import { useCallback, useState } from "react";
import { useCardanoError } from "@gulla0/cardano-error-normalizer/react";

const tx = useCardanoError({
  operation: submitTx,
  defaults: { source: "provider_submit", stage: "submit" },
  config: {
    hooks: { useState, useCallback }
  }
});
```

`useCardanoError` returns `loading`, `data`, `error`, `run`, `normalize`, and `reset`. `run(...)` rethrows normalized `CardanoAppError`.

Legacy runtimes that expose `globalThis.React` can use compatibility mode:

```ts
import { useCardanoError } from "@gulla0/cardano-error-normalizer/react/compat";
```

## Context Contract

| Field | Required | Notes |
| --- | --- | --- |
| `source` | yes (defaulted) | Defaults to `provider_query` if omitted. |
| `stage` | yes (defaulted) | Defaults to `build` if omitted. |
| `provider` | no | Copied to `CardanoAppError.provider` unless adapter overrides it. |
| `network` | no | Defaults to `unknown` in final output. |
| `walletHint` | no | Hint only; lands in `CardanoAppError.wallet.name` when no richer wallet data exists. |
| `txHash` | no | Copied to `CardanoAppError.txHash`. |
| `timestamp` | no | Uses current ISO timestamp when omitted. |

## Resolution Hints (Authority Level)

- `resolution` from canonical error code mapping is authoritative for that code family.
- `resolution` attached after heuristic message matching (`smartMatcher`) is best-effort guidance.
- For `UNKNOWN`, treat `resolution` as optional troubleshooting help, not truth.

## Debug and Trace Modes

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

Warning: `debug` may log portions of raw error payloads (`input`, `context`, `output`). Do not enable in production unless that is acceptable for your data-handling policy.

## Rendering Actionable Hints

```ts
import {
  isCardanoAppError,
  withErrorSafety
} from "@gulla0/cardano-error-normalizer";

try {
  await withErrorSafety(provider, {
    ctx: { source: "provider_submit", stage: "submit" }
  }).submitTx(txCborHex);
} catch (err) {
  if (!isCardanoAppError(err)) {
    throw err;
  }

  const title = err.resolution?.title ?? "Troubleshoot transaction failure";
  const steps = err.resolution?.steps ?? ["Inspect logs and retry"];
  renderHintCard({ title, steps });
}
```

## Default Adapter Order

`createNormalizer({ config })` runs adapters in this order:

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
| DataSignError (wallet-specific observed behavior) | `1` | ProofGeneration | `WALLET_DATA_SIGN_PROOF_GENERATION` |
| DataSignError (wallet-specific observed behavior) | `2` | AddressNotPK | `WALLET_DATA_SIGN_ADDRESS_NOT_PK` |
| DataSignError (wallet-specific observed behavior) | `3` | UserDeclined | `WALLET_DATA_SIGN_USER_DECLINED` |
| PaginateError (wallet-specific observed behavior) | n/a (`maxSize`) | requested page exceeds range | `WALLET_PAGINATION_OUT_OF_RANGE` |
| TxSendError | `1` | Refused | `WALLET_SUBMIT_REFUSED` |
| TxSendError | `2` | Failure | `WALLET_SUBMIT_FAILURE` |

Submit-path disambiguation note: `APIError` `code=-2` normally maps to `WALLET_INTERNAL`, but maps to `WALLET_SUBMIT_FAILURE` when submit intent is explicit (`source=wallet_submit` or `stage=submit`) or when `info` indicates `submitTx`.

## Blockfrost Mapping Table

`fromBlockfrostError` uses key-based parsing (`status_code`, `error`, `message`) across nested payloads, so mapping does not depend on JSON property order.

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

The following are heuristic regex matches (best-effort, not protocol-authoritative):

- `/DeserialiseFailure|DecoderFailure|expected word/i` -> `TX_DESERIALISE_FAILURE`
- `/BadInputsUTxO/i` -> `TX_INPUTS_MISSING_OR_SPENT`
- `/OutputTooSmallUTxO|BabbageOutputTooSmallUTxO/i` -> `TX_OUTPUT_TOO_SMALL`
- `/ValueNotConservedUTxO/i` -> `TX_VALUE_NOT_CONSERVED`
- `/ScriptFailure|PlutusFailure|EvaluationFailure|ValidationTagMismatch|redeemer.*execution units/i` -> `TX_SCRIPT_EVALUATION_FAILED`
- `/ShelleyTxValidationError|ApplyTxError/i` -> `TX_LEDGER_VALIDATION_FAILED` when no inner specific tag is found

## Contributing / Local Development

Validate this repository locally:

```bash
npm install
npm test
npm run typecheck
npm run build
```

Capture runtime fixtures before rethrowing:

```ts
console.error("RUNTIME_ERROR_SAMPLE", {
  err,
  ctx: { source: "provider_submit", stage: "submit", provider: "blockfrost", network: "preprod" }
});
```

## Example

See `examples/mesh-blockfrost-eternl.ts` in the repository for an end-to-end Mesh + Blockfrost + Eternl flow.
