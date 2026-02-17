# Current Progress

## Project
- Name: Cardano Error Normalizer MVP
- Source plan: `mvp.md`
- Last updated: 2026-02-17

## Workflow Rules
- After each small section is built, run tests for that section.
- Iterate logic until tests pass.
- Update this file before each commit.
- Keep decisions and scope changes logged.

## MVP Section Breakdown (Seed Checklist)

### 1) MVP Objective
- [x] Objective confirmed and implementation scope locked.
- [x] Out-of-scope items explicitly excluded from current work.

### 2) Target Users and Primary Flows
- [x] Primary flow validated in API design (`normalize(err, ctx)` -> `CardanoAppError`).
- [x] User-facing error stability assumptions documented.

### 3) MVP Technical Scope

#### 3.1 Canonical Error Model
- [x] `ErrorSource`, `ErrorStage`, `ErrorSeverity` implemented.
- [x] `CardanoAppError` implemented with required fields.
- [x] `raw` payload preservation verified.

#### 3.2 MVP Error Code Set (v1)
- [x] v1 code list implemented in `src/codes.ts`.
- [x] No extra non-MVP codes introduced.

#### 3.3 Adapters Included in MVP
- [ ] `fromWalletError` implemented.
- [ ] `fromBlockfrostError` implemented.
- [ ] `fromNodeStringError` implemented.
- [ ] `fromMeshError` unwrap-first implemented.
- [ ] Default adapter order matches `mvp.md`.

#### 3.4 Heuristic Rules (MVP)
- [ ] Regex mappings implemented for deserialise/input/output/value/script/wrapper paths.
- [ ] Wrapper extraction behavior implemented (`ApplyTxError`, `ShelleyTxValidationError`).

#### 3.5 Canonical Mapping Tables (Source of Truth)
- [ ] CIP-30/CIP-95 mapping table implemented exactly.
- [ ] Blockfrost status mapping table implemented exactly.
- [ ] Table-driven tests added for both mappings.

#### 3.6 Public API (MVP)
- [x] `NormalizeContext` implemented.
- [x] `AdapterFn`, `Normalizer`, `createNormalizer` exported.

### 4) Repository and Package Structure
- [ ] `/src` structure matches plan.
- [ ] `/test` fixture and test file structure matches plan.
- [ ] `/examples/mesh-blockfrost-eternl.ts` added.

### 5) Implementation Plan Status

#### Phase 1: Core Types and Normalizer
- Status: `Completed`
- [x] Types and interfaces complete.
- [x] Ordered adapter execution + fallback complete.
- [x] Optional fingerprint support complete.
- [x] Phase tests passing.
- [x] Phase committed.

#### Phase 2: Wallet + Blockfrost Adapters
- Status: `Not Started`
- [ ] Wallet deterministic mappings complete.
- [ ] CIP-95 known extension handling complete.
- [ ] Blockfrost parser and mappings complete.
- [ ] `raw` + `meta` preservation complete.
- [ ] Phase tests passing.
- [ ] Phase committed.

#### Phase 3: Node Heuristics + Mesh Wrapper
- Status: `Not Started`
- [ ] Node regex adapter complete.
- [ ] Mesh unwrap/delegate behavior complete.
- [ ] Fallback behavior complete.
- [ ] Phase tests passing.
- [ ] Phase committed.

#### Phase 4: Tests + Example + Docs
- Status: `Not Started`
- [ ] Mapping branch unit tests complete.
- [ ] Integration adapter-order tests complete.
- [ ] Example integration snippet complete.
- [ ] README quickstart + mapping docs complete.
- [ ] Full test suite passing.
- [ ] Release candidate ready (`v0.1.0`).

### 6) Acceptance Criteria Checklist
- [x] `normalize()` always returns valid `CardanoAppError`.
- [ ] Deterministic wallet and Blockfrost mappings pass.
- [ ] Blockfrost `402` -> `QUOTA_EXCEEDED`.
- [ ] Blockfrost `418` -> `FORBIDDEN` + `meta.blockfrostReason="auto_banned"`.
- [ ] Mesh-wrapped errors unwrap before heuristic fallback.
- [ ] Node fixtures map for `BadInputsUTxO`, `OutputTooSmallUTxO`, `ValueNotConservedUTxO`, deserialise/decoder failures.
- [ ] Wrapper errors map via inner extraction or `TX_LEDGER_VALIDATION_FAILED`.
- [x] Unknown shapes preserve `raw` and map to `UNKNOWN`.
- [ ] CI tests pass.

## Current Build Focus
- Active section: `Phase 2 - Wallet + Blockfrost Adapters`
- Current task: `Implement wallet and Blockfrost adapters with table-driven mappings`
- Blockers: `None logged`

## Decisions Log
- Date: 2026-02-17
- Section: Project process
- Decision: Use this file as the seed checklist mapped directly to `mvp.md`.
- Reason: Keep build sequence and quality gates explicit.
- Impact: Every phase now has a test-and-commit gate before moving forward.

- Date: 2026-02-17
- Section: Phase 1 core architecture
- Decision: Keep normalizer adapter-driven with strict fallback finalization and optional deterministic fingerprinting.
- Reason: Preserve a stable contract now, while allowing adapters to be layered in later phases.
- Impact: Phase 2/3 can add adapters without changing public API shape.

- Date: 2026-02-17
- Section: Fingerprint implementation compatibility
- Decision: Replace `node:crypto` hashing with a deterministic pure-TypeScript FNV-1a-style hash.
- Reason: Avoid TypeScript `ts(2307)` in environments without Node builtin type declarations.
- Impact: Fingerprinting remains deterministic without runtime-specific imports.

## Testing Notes
- Last run: 2026-02-17
- Result: Pass (3/3 tests)
- Notes: `npm test` using Node test runner with `--experimental-strip-types`; verified fallback validity, adapter ordering, and fingerprint determinism after removing `node:crypto` import.

## Commit Log
- 2026-02-17: `4902835` - Build Phase 1 core types and normalizer.
- Pending: commit for fingerprint compatibility fix (`src/utils/fingerprint.ts`).

## Next
- [ ] Read `mvp.md` and this file at start of the next cycle.
- [ ] Implement next unchecked item in active phase.
- [ ] Run relevant tests until passing.
- [ ] Update this file.
- [ ] Commit.
