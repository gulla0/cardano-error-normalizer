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
- [ ] Objective confirmed and implementation scope locked.
- [ ] Out-of-scope items explicitly excluded from current work.

### 2) Target Users and Primary Flows
- [ ] Primary flow validated in API design (`normalize(err, ctx)` -> `CardanoAppError`).
- [ ] User-facing error stability assumptions documented.

### 3) MVP Technical Scope

#### 3.1 Canonical Error Model
- [ ] `ErrorSource`, `ErrorStage`, `ErrorSeverity` implemented.
- [ ] `CardanoAppError` implemented with required fields.
- [ ] `raw` payload preservation verified.

#### 3.2 MVP Error Code Set (v1)
- [ ] v1 code list implemented in `src/codes.ts`.
- [ ] No extra non-MVP codes introduced.

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
- [ ] `NormalizeContext` implemented.
- [ ] `AdapterFn`, `Normalizer`, `createNormalizer` exported.

### 4) Repository and Package Structure
- [ ] `/src` structure matches plan.
- [ ] `/test` fixture and test file structure matches plan.
- [ ] `/examples/mesh-blockfrost-eternl.ts` added.

### 5) Implementation Plan Status

#### Phase 1: Core Types and Normalizer
- Status: `Not Started`
- [ ] Types and interfaces complete.
- [ ] Ordered adapter execution + fallback complete.
- [ ] Optional fingerprint support complete.
- [ ] Phase tests passing.
- [ ] Phase committed.

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
- [ ] `normalize()` always returns valid `CardanoAppError`.
- [ ] Deterministic wallet and Blockfrost mappings pass.
- [ ] Blockfrost `402` -> `QUOTA_EXCEEDED`.
- [ ] Blockfrost `418` -> `FORBIDDEN` + `meta.blockfrostReason="auto_banned"`.
- [ ] Mesh-wrapped errors unwrap before heuristic fallback.
- [ ] Node fixtures map for `BadInputsUTxO`, `OutputTooSmallUTxO`, `ValueNotConservedUTxO`, deserialise/decoder failures.
- [ ] Wrapper errors map via inner extraction or `TX_LEDGER_VALIDATION_FAILED`.
- [ ] Unknown shapes preserve `raw` and map to `UNKNOWN`.
- [ ] CI tests pass.

## Current Build Focus
- Active section: `Phase 1 - Core Types and Normalizer`
- Current task: `Not started`
- Blockers: `None logged`

## Decisions Log
- Date: 2026-02-17
- Section: Project process
- Decision: Use this file as the seed checklist mapped directly to `mvp.md`.
- Reason: Keep build sequence and quality gates explicit.
- Impact: Every phase now has a test-and-commit gate before moving forward.

## Testing Notes
- Last run: Not yet recorded
- Result: Pending
- Notes: Record command(s), failures, fixes, and final pass signal for each section.

## Commit Log
- No commits logged yet for MVP execution.

## Next
- [ ] Read `mvp.md` and this file at start of the next cycle.
- [ ] Implement next unchecked item in active phase.
- [ ] Run relevant tests until passing.
- [ ] Update this file.
- [ ] Commit.

