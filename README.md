# Cardano Error Normalizer (MVP)

A small TypeScript library that normalizes heterogeneous Cardano stack errors into a stable `CardanoAppError` shape.

## Install

```bash
npm install cardano-error-normalizer
```

## Quickstart

```ts
import { createNormalizer } from "cardano-error-normalizer";

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
