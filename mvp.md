# Cardano Error Normalizer MVP

## 1) MVP Objective
Build a portable TypeScript library that normalizes heterogeneous Cardano stack errors into one stable shape (`CardanoAppError`) for app UX, logging, and analytics.

MVP focus:
- Mesh + Blockfrost + Eternl/CIP-30 integration path.
- Deterministic mappings where standards exist (CIP-30, known CIP-95 extensions, HTTP status).
- Heuristic mappings for string-based node/submit failures.
- Preserve raw payloads for debugging.

Out of scope for MVP:
- Full coverage of all ledger-era error variants.
- UI package or dashboard.
- Multi-language SDKs.

## 2) Target Users and Primary Flows
- dApp frontend engineers handling wallet sign/submit failures.
- Backend/API engineers handling provider and node submit failures.
- DevOps/observability consumers who need stable error grouping.

Primary flow:
1. App catches any error (`unknown`).
2. App calls `normalizer.normalize(err, ctx)`.
3. App receives a `CardanoAppError` with stable code + metadata.
4. App uses `code` for UX/retry logic and `raw` for diagnostics.

## 3) MVP Technical Scope

### 3.1 Canonical Error Model
Implement as the core public contract:

```ts
export type ErrorSource =
  | "mesh_build"
  | "wallet_sign"
  | "wallet_submit"
  | "provider_query"
  | "provider_submit"
  | "node_submit";

export type ErrorStage = "build" | "sign" | "submit";
export type ErrorSeverity = "debug" | "info" | "warn" | "error";

export interface CardanoAppError {
  name: "CardanoAppError";
  source: ErrorSource;
  stage: ErrorStage;
  code: CardanoErrorCode;
  severity: ErrorSeverity;
  message: string;
  detail?: string;
  timestamp: string;
  network?: "mainnet" | "preprod" | "preview" | "sanchonet" | "unknown";
  provider?: "blockfrost" | "koios" | "ogmios" | "cardano-node" | string;
  wallet?: { name?: string; apiVersion?: string; version?: string };
  txHash?: string;
  txCborHexHash?: string;
  raw: unknown;
  fingerprint?: string;
  meta?: Record<string, unknown>;
}
```

### 3.2 MVP Error Code Set (v1)
Start with a constrained, actionable subset:

- `UNKNOWN`
- `UNEXPECTED_SHAPE`
- `NETWORK_UNREACHABLE`
- `TIMEOUT`
- `RATE_LIMITED`
- `QUOTA_EXCEEDED`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `BAD_REQUEST`
- `PROVIDER_INTERNAL`
- `MEMPOOL_FULL`
- `WALLET_INVALID_REQUEST`
- `WALLET_INTERNAL`
- `WALLET_REFUSED`
- `WALLET_ACCOUNT_CHANGED`
- `WALLET_SIGN_USER_DECLINED`
- `WALLET_SIGN_PROOF_GENERATION`
- `WALLET_SUBMIT_REFUSED`
- `WALLET_SUBMIT_FAILURE`
- `TX_DESERIALISE_FAILURE`
- `TX_INPUTS_MISSING_OR_SPENT`
- `TX_OUTPUT_TOO_SMALL`
- `TX_VALUE_NOT_CONSERVED`
- `TX_LEDGER_VALIDATION_FAILED`
- `TX_SCRIPT_EVALUATION_FAILED`

### 3.3 Adapters Included in MVP
Implement these adapters first:

1. `fromWalletError` (CIP-30 `{code, info}` + known CIP-95 extensions)
2. `fromBlockfrostError` (accept required keys `status_code/error/message` in any key order)
3. `fromNodeStringError` (regex matching for submit-api/CLI/node text)
4. `fromMeshError` (unwrap nested provider/wallet errors; fallback generic mapping)

Adapter order in default normalizer (unwrap-first):
1. Mesh unwrap adapter (extract nested inner error and re-run adapter chain)
2. Wallet
3. Blockfrost
4. Node string heuristics
5. Fallback (`UNKNOWN`)

### 3.4 Heuristic Rules (MVP)
Regex-to-code mappings:
- `/DeserialiseFailure|DecoderFailure|expected word/i` -> `TX_DESERIALISE_FAILURE`
- `/BadInputsUTxO/i` -> `TX_INPUTS_MISSING_OR_SPENT`
- `/OutputTooSmallUTxO|BabbageOutputTooSmallUTxO/i` -> `TX_OUTPUT_TOO_SMALL`
- `/ValueNotConservedUTxO/i` -> `TX_VALUE_NOT_CONSERVED`
- `/ScriptFailure|PlutusFailure|EvaluationFailure|ValidationTagMismatch|redeemer.*execution units/i` -> `TX_SCRIPT_EVALUATION_FAILED`
- `/ShelleyTxValidationError|ApplyTxError/i` -> wrapper only; extract inner failure tag first, else `TX_LEDGER_VALIDATION_FAILED`

Blockfrost status mappings (MVP):
- `402` -> `QUOTA_EXCEEDED` (daily request limit exceeded)
- `418` -> `RATE_LIMITED` (auto-ban after flooding)
- `425` -> `MEMPOOL_FULL`
- `429` -> `RATE_LIMITED`

### 3.5 Public API (MVP)
```ts
export interface NormalizeContext {
  source: ErrorSource;
  stage: ErrorStage;
  network?: CardanoAppError["network"];
  provider?: string;
  walletHint?: string;
  txHash?: string;
  timestamp?: string;
}

export type AdapterFn = (err: unknown, ctx: NormalizeContext) => CardanoAppError | null;

export interface Normalizer {
  normalize(err: unknown, ctx: NormalizeContext): CardanoAppError;
}

export function createNormalizer(config?: Partial<NormalizerConfig>): Normalizer;
```

## 4) Repository and Package Structure
```text
/src
  /types.ts
  /codes.ts
  /normalizer.ts
  /adapters
    /wallet.ts
    /blockfrost.ts
    /node-string.ts
    /mesh.ts
  /utils
    /guards.ts
    /fingerprint.ts
  /index.ts
/test
  /fixtures
    /wallet-errors.json
    /blockfrost-errors.json
    /node-errors.txt
  /adapters.wallet.test.ts
  /adapters.blockfrost.test.ts
  /adapters.node-string.test.ts
  /normalizer.integration.test.ts
/examples
  /mesh-blockfrost-eternl.ts
```

## 5) Implementation Plan

### Phase 1: Core Types and Normalizer (Day 1)
- Define `CardanoAppError`, context, adapter interfaces, and code enum/union.
- Implement `createNormalizer()` with ordered adapter execution and fallback.
- Add optional deterministic fingerprint (`source|stage|code|provider` hash/input string).

Deliverable:
- Compilable package core with no adapters.

### Phase 2: Wallet + Blockfrost Adapters (Day 1-2)
- Implement deterministic CIP-30 code mapping plus explicit handling of known CIP-95 extensions (e.g., `DeprecatedCertificate`).
- Implement Blockfrost body parser and status-to-code mapping using required keys only (key order agnostic), including explicit `402` quota handling.
- Preserve full `raw` payload and include parsed fields in `meta`.

Deliverable:
- Accurate mapping for common wallet and provider failures in the target stack.

### Phase 3: Node String Heuristics + Mesh Wrapper (Day 2)
- Implement regex-based node/string adapter.
- Implement Mesh adapter as unwrap-first: inspect wrapped error cause/response fields, extract inner errors, and delegate back through wallet/blockfrost/node adapters before final fallback.
- Add clear fallback behavior when no structured shape is detected.

Deliverable:
- End-to-end normalization for real mixed-stack failures.

### Phase 4: Tests + Example + Docs (Day 3)
- Unit tests for every mapping branch.
- Integration tests validating adapter ordering.
- Example integration snippet for Mesh + Blockfrost + Eternl.
- README with quickstart and error mapping table.

Deliverable:
- MVP release candidate (`v0.1.0`).

## 6) Acceptance Criteria
- `normalize()` always returns a valid `CardanoAppError`.
- 100% deterministic mapping for:
  - CIP-30 wallet error codes, plus explicit handling for known CIP-95 extensions (e.g., `DeprecatedCertificate`).
  - Blockfrost HTTP statuses in MVP scope (402/403/404/418/425/429/5xx/4xx fallback), with payload parsing that is key-order agnostic.
- Blockfrost `402` is mapped explicitly to `QUOTA_EXCEEDED` (not folded into generic `BAD_REQUEST`).
- Mesh-wrapped errors are unwrapped before heuristic matching so provider/wallet-specific mappings win over node-string fallback.
- Node string adapter correctly maps fixture errors for:
  - `BadInputsUTxO`
  - `OutputTooSmallUTxO`
  - `ValueNotConservedUTxO`
  - deserialise/decoder failures.
- Wrapper errors (`ShelleyTxValidationError`, `ApplyTxError`) are never directly forced to script/policy rejection; they map using inner tag extraction or fallback `TX_LEDGER_VALIDATION_FAILED`.
- Unknown shapes preserve full `raw` payload and return `UNKNOWN`.
- Test suite passes in CI.

## 7) Testing Strategy
- Unit tests:
  - one test per code mapping branch.
  - malformed payload tests (`UNEXPECTED_SHAPE` and fallback behavior).
- Fixture tests:
  - replay captured real-world payloads from wallet/provider/node logs.
- Contract tests:
  - assert output schema and required fields.
- Regression tests:
  - each newly observed production error adds a fixture + expected code.

## 8) Risks and Mitigations
- Risk: String heuristics overfit or misclassify.
  - Mitigation: Keep mappings narrow; default to `UNKNOWN`; preserve `raw`; add regression fixtures quickly.
- Risk: Wallet/provider wrappers vary by client library.
  - Mitigation: Adapter guard functions inspect multiple common nesting paths (`error`, `response.data`, `cause`).
- Risk: Taxonomy churn.
  - Mitigation: Versioned code list; deprecate codes gradually; keep semantic stability guarantees.

## 9) Post-MVP Backlog
- Add Koios/PostgREST adapter.
- Add Ogmios JSON-RPC adapter (including 3000-3999 tx protocol range handling).
- Add richer severity/retry hints (`meta.retryable`).
- Add optional OpenTelemetry semantic event exporter.
- Add browser and Node bundle size budget checks.

## 10) Definition of Done for MVP
- Published package with typed API.
- README + example usage for Mesh + Blockfrost + Eternl.
- Green tests covering all MVP mappings.
- Changelog entry documenting code taxonomy v1 and known limitations.
