# Root API (`@gulla0/cardano-error-normalizer`)

## Value Exports

### `CARDANO_ERROR_CODES`
```ts
const CARDANO_ERROR_CODES: readonly [
  "UNKNOWN",
  "UNEXPECTED_SHAPE",
  "NETWORK_UNREACHABLE",
  "TIMEOUT",
  "RATE_LIMITED",
  "QUOTA_EXCEEDED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BAD_REQUEST",
  "PROVIDER_INTERNAL",
  "MEMPOOL_FULL",
  "WALLET_INVALID_REQUEST",
  "WALLET_INTERNAL",
  "WALLET_REFUSED",
  "WALLET_ACCOUNT_CHANGED",
  "WALLET_SIGN_USER_DECLINED",
  "WALLET_SIGN_PROOF_GENERATION",
  "WALLET_DATA_SIGN_PROOF_GENERATION",
  "WALLET_DATA_SIGN_ADDRESS_NOT_PK",
  "WALLET_DATA_SIGN_USER_DECLINED",
  "WALLET_PAGINATION_OUT_OF_RANGE",
  "WALLET_SUBMIT_REFUSED",
  "WALLET_SUBMIT_FAILURE",
  "TX_DESERIALISE_FAILURE",
  "TX_INPUTS_MISSING_OR_SPENT",
  "TX_OUTPUT_TOO_SMALL",
  "TX_VALUE_NOT_CONSERVED",
  "TX_LEDGER_VALIDATION_FAILED",
  "TX_SCRIPT_EVALUATION_FAILED"
];
```
Definition: canonical error code catalog used across adapters and normalizers.

### `createNormalizer`
```ts
function createNormalizer(
  options?:
    | { config?: NormalizerConfig; defaults?: Partial<NormalizeContext> }
    | NormalizerConfig
): Normalizer;
```
Definition: builds the base adapter-driven normalizer. It runs configured adapters in order, returns first match, and falls back to `UNKNOWN` using extracted message/context defaults.

### `createSmartNormalizer`
```ts
function createSmartNormalizer(
  options?:
    | { config?: NormalizerConfig; defaults?: Partial<NormalizeContext> }
    | NormalizerConfig
): Normalizer;
```
Definition: wraps `createNormalizer` with post-processing. It adds message heuristics (timeouts/network/rate/quota), attaches code-based resolutions, optionally parses traces into `meta`, and supports debug logging.

### `getResolutionForCode`
```ts
function getResolutionForCode(
  code: CardanoErrorCode
): ErrorResolution | undefined;
```
Definition: returns a defensive copy of a predefined resolution playbook for a given `CardanoErrorCode`.

### `globalNormalizer`
```ts
const globalNormalizer: Normalizer;
```
Definition: singleton smart normalizer created with default config.

### `normalizeError`
```ts
function normalizeError(
  err: unknown,
  ctx?: Partial<NormalizeContext>,
  config?: NormalizeConfig
): CardanoAppError;
```
Definition: convenience entrypoint for one-off normalization. Uses `globalNormalizer` unless `config` is provided, and merges analyzer-inferred metadata into `meta`.

### `fromWalletError`
```ts
function fromWalletError(
  err: unknown,
  ctx?: NormalizeContext
): Partial<CardanoAppError> | null;
```
Definition: maps CIP-30 wallet error shapes and pagination errors to wallet-specific normalized codes/severity/stage metadata.

### `fromBlockfrostError`
```ts
function fromBlockfrostError(
  err: unknown
): Partial<CardanoAppError> | null;
```
Definition: maps Blockfrost-style payloads (`status_code/error/message`) to provider codes (`QUOTA_EXCEEDED`, `RATE_LIMITED`, etc.) with Blockfrost metadata.

### `fromMeshError`
```ts
function fromMeshError(
  err: unknown,
  _ctx: NormalizeContext,
  delegates?: Array<(err: unknown) => Partial<CardanoAppError> | null>
): Partial<CardanoAppError> | null;
```
Definition: unwraps nested Mesh error containers and delegates mapping to wallet/blockfrost/node-string adapters; tags matches with `meta.meshUnwrapped`.

### `fromNodeStringError`
```ts
function fromNodeStringError(
  err: unknown
): Partial<CardanoAppError> | null;
```
Definition: pattern-matches node/ledger string errors into transaction submission codes (deserialize, bad inputs, script failure, etc.).

### `withErrorSafety`
```ts
function withErrorSafety<T extends object>(
  provider: T,
  options: WithErrorSafetyOptions
): T;
```
Definition: returns a `Proxy` that wraps provider methods, catches sync/async failures, normalizes the error, annotates method metadata, invokes `onError`, and rethrows `CardanoAppError`.

### `isCardanoAppError`
```ts
function isCardanoAppError(
  err: unknown
): err is CardanoAppError;
```
Definition: runtime type guard for normalized error objects.

### `meshProviderPreset`
```ts
function meshProviderPreset<T extends object>(
  provider: T,
  options?: MeshProviderPresetOptions
): T;
```
Definition: specialized `withErrorSafety` wrapper for Mesh providers with method-to-context mapping (query vs submit) and optional provider hint.

### `cip30WalletPreset`
```ts
function cip30WalletPreset<T extends object>(
  walletApi: T,
  options?: Cip30WalletPresetOptions
): T;
```
Definition: specialized `withErrorSafety` wrapper for CIP-30 wallet APIs with method-to-context mapping (`getUtxos`, `signTx`, `signData`, `submitTx`) and wallet hint support.

## Type Exports

### `CardanoErrorCode`
```ts
type CardanoErrorCode = (typeof CARDANO_ERROR_CODES)[number];
```
Definition: union of all canonical code string literals.

### `ErrorSource`
```ts
type ErrorSource =
  | "mesh_build"
  | "wallet_query"
  | "wallet_sign"
  | "wallet_submit"
  | "provider_query"
  | "provider_submit"
  | "node_submit";
```
Definition: source system and operation family that emitted the error.

### `ErrorStage`
```ts
type ErrorStage = "build" | "sign" | "submit";
```
Definition: high-level lifecycle stage where the failure occurred.

### `ErrorSeverity`
```ts
type ErrorSeverity = "debug" | "info" | "warn" | "error";
```
Definition: normalized severity classification.

### `ErrorResolution`
```ts
interface ErrorResolution {
  title: string;
  steps: string[];
  docsUrl?: string;
}
```
Definition: actionable remediation guidance attached to normalized errors.

### `CardanoAppError`
```ts
interface CardanoAppError {
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
  originalError: unknown;
  resolution?: ErrorResolution;
  fingerprint?: string;
  meta?: Record<string, unknown>;
}
```
Definition: stable normalized error contract returned/thrown by library utilities.

### `NormalizeContext`
```ts
interface NormalizeContext {
  source: ErrorSource;
  stage: ErrorStage;
  network?: CardanoAppError["network"];
  provider?: string;
  walletHint?: string;
  txHash?: string;
  timestamp?: string;
}
```
Definition: contextual hints used during normalization and finalization.

### `NormalizeConfig`
```ts
interface NormalizeConfig {
  adapters?: AdapterFn[];
  includeFingerprint?: boolean;
  debug?: boolean;
  parseTraces?: boolean;
}
```
Definition: behavior toggles and adapter list for normalizer construction.

### `AdapterFn`
```ts
type AdapterFn = (
  err: unknown,
  ctx: NormalizeContext
) => CardanoAppError | Partial<CardanoAppError> | null;
```
Definition: adapter contract for mapping arbitrary errors into normalized shape fragments.

### `Normalizer`
```ts
interface Normalizer {
  normalize(err: unknown, ctx?: Partial<NormalizeContext>): CardanoAppError;
  withDefaults(moreDefaults: Partial<NormalizeContext>): Normalizer;
}
```
Definition: normalizer instance interface with immutable default-context extension.

### `NormalizerConfig`
```ts
type NormalizerConfig = NormalizeConfig;
```
Definition: alias used for API clarity where config specifically targets normalizer creation.

### `WithErrorSafetyOptions`
```ts
interface WithErrorSafetyOptions {
  ctx: NormalizeContext | ((method: string, args: unknown[]) => NormalizeContext);
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (
    normalized: CardanoAppError,
    details: { method: string; args: unknown[] }
  ) => void;
}
```
Definition: configuration for method-wrapping provider proxy behavior.

### `MeshProviderPresetOptions`
```ts
interface MeshProviderPresetOptions {
  provider?: string;
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (
    normalized: CardanoAppError,
    details: { method: string; args: unknown[] }
  ) => void;
}
```
Definition: options for mesh provider safety preset.

### `Cip30WalletPresetOptions`
```ts
interface Cip30WalletPresetOptions {
  walletHint?: string;
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (
    normalized: CardanoAppError,
    details: { method: string; args: unknown[] }
  ) => void;
}
```
Definition: options for CIP-30 wallet safety preset.
