# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-02-18

### Added
- Smart normalization pipeline via `createSmartNormalizer` with message matchers, resolution hint attachment, optional trace parsing, and guarded debug logging.
- Resolution lookup table and helper (`getResolutionForCode`) to attach actionable remediation guidance by normalized code.
- Direct React subpath entrypoint `@gulla0/cardano-error-normalizer/react` with `useCardanoError(...)` and `executeWithSafety(...)`.
- Expanded tests for smart normalization branches, wrapper safety behavior, and React hook/safety integration paths.

### Changed
- `withErrorSafety` now supports `normalizerConfig` and resolves precedence as explicit `normalizer` override, then per-wrapper smart config, then global default.
- `./react` package export now points to `dist/react/index.*`, and React helper surface is consolidated behind `src/react/index.ts`.
- README integration guidance now prefers direct `useCardanoError` subpath import and documents DX v2 debug/trace options and resolution-hint rendering.
- Wallet `APIError` `code=-2` is now disambiguated to `WALLET_SUBMIT_FAILURE` for explicit submit intent (`wallet_submit`/`submit` context or `submitTx` info), while non-submit contexts remain `WALLET_INTERNAL`.
- Verification run against live Mesh + Blockfrost + Eternl flows confirmed submit/sign mappings (`WALLET_SUBMIT_FAILURE`, `WALLET_SIGN_USER_DECLINED`) and Blockfrost `400` handling.

## [0.1.0] - 2026-02-17

### Added
- MVP public API for deterministic error normalization via `normalize(err, ctx)` and `createNormalizer`.
- Canonical `CardanoAppError` model with preserved `raw` payloads and optional deterministic fingerprinting.
- Wallet adapter mappings for CIP-30 and known CIP-95 extension cases.
- Blockfrost adapter mappings for scoped HTTP status handling (`400/402/403/404/418/425/429/5xx` + `4xx` fallback).
- Node string heuristic mappings for submit/ledger error tags and wrapper extraction behavior.
- Mesh unwrap-first adapter behavior to delegate nested provider/wallet payloads before node heuristics.
- Test suite coverage for mapping branches, adapter ordering, and unknown-shape fallback behavior.
- Example integration snippet for Mesh + Blockfrost + Eternl.
- CI workflow (`npm ci` + `npm test`) on push and pull request.

### Taxonomy (v1)
`UNKNOWN`, `UNEXPECTED_SHAPE`, `NETWORK_UNREACHABLE`, `TIMEOUT`, `RATE_LIMITED`, `QUOTA_EXCEEDED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `PROVIDER_INTERNAL`, `MEMPOOL_FULL`, `WALLET_INVALID_REQUEST`, `WALLET_INTERNAL`, `WALLET_REFUSED`, `WALLET_ACCOUNT_CHANGED`, `WALLET_SIGN_USER_DECLINED`, `WALLET_SIGN_PROOF_GENERATION`, `WALLET_SUBMIT_REFUSED`, `WALLET_SUBMIT_FAILURE`, `TX_DESERIALISE_FAILURE`, `TX_INPUTS_MISSING_OR_SPENT`, `TX_OUTPUT_TOO_SMALL`, `TX_VALUE_NOT_CONSERVED`, `TX_LEDGER_VALIDATION_FAILED`, `TX_SCRIPT_EVALUATION_FAILED`

### Known Limitations
- Error taxonomy coverage is intentionally scoped to MVP mappings and heuristics; unknown or out-of-scope failures resolve to `UNKNOWN` with preserved `raw`.
- String-based node classification may miss ledger-era/provider-specific variants not yet represented in fixtures.
- Deterministic mappings currently focus on the Mesh + Blockfrost + Eternl target path.
- Real-time fixture coverage is still sample-driven; newly observed production payload variants should continue to be added as regression fixtures.
