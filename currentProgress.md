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
- If the build is completed as per MVP, let the user know it is ready for real-time testing.

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
- [x] `fromWalletError` implemented.
- [x] `fromBlockfrostError` implemented.
- [x] `fromNodeStringError` implemented.
- [x] `fromMeshError` unwrap-first implemented.
- [x] Default adapter order matches `mvp.md`.

#### 3.4 Heuristic Rules (MVP)
- [x] Regex mappings implemented for deserialise/input/output/value/script/wrapper paths.
- [x] Wrapper extraction behavior implemented (`ApplyTxError`, `ShelleyTxValidationError`).

#### 3.5 Canonical Mapping Tables (Source of Truth)
- [x] CIP-30/CIP-95 mapping table implemented exactly.
- [x] Blockfrost status mapping table implemented exactly.
- [x] Table-driven tests added for both mappings.

#### 3.6 Public API (MVP)
- [x] `NormalizeContext` implemented.
- [x] `AdapterFn`, `Normalizer`, `createNormalizer` exported.

### 4) Repository and Package Structure
- [x] `/src` structure matches plan.
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
- Status: `Completed`
- [x] Wallet deterministic mappings complete.
- [x] CIP-95 known extension handling complete.
- [x] Blockfrost parser and mappings complete.
- [x] `raw` + `meta` preservation complete.
- [x] Phase tests passing.
- [x] Phase committed.

#### Phase 3: Node Heuristics + Mesh Wrapper
- Status: `Completed`
- [x] Node regex adapter complete.
- [x] Mesh unwrap/delegate behavior complete.
- [x] Fallback behavior complete.
- [x] Phase tests passing.
- [x] Phase committed.

#### Phase 4: Tests + Example + Docs
- Status: `In Progress`
- [x] Mapping branch unit tests complete.
- [ ] Integration adapter-order tests complete.
- [ ] Example integration snippet complete.
- [ ] README quickstart + mapping docs complete.
- [ ] Full test suite passing.
- [ ] Release candidate ready (`v0.1.0`).

### 6) Acceptance Criteria Checklist
- [x] `normalize()` always returns valid `CardanoAppError`.
- [x] Deterministic wallet and Blockfrost mappings pass.
- [x] Blockfrost `402` -> `QUOTA_EXCEEDED`.
- [x] Blockfrost `418` -> `FORBIDDEN` + `meta.blockfrostReason="auto_banned"`.
- [x] Mesh-wrapped errors unwrap before heuristic fallback.
- [x] Node fixtures map for `BadInputsUTxO`, `OutputTooSmallUTxO`, `ValueNotConservedUTxO`, deserialise/decoder failures.
- [x] Wrapper errors map via inner extraction or `TX_LEDGER_VALIDATION_FAILED`.
- [x] Unknown shapes preserve `raw` and map to `UNKNOWN`.
- [ ] CI tests pass.

## Current Build Focus
- Active section: `Phase 4 - Tests + Example + Docs`
- Current task: `Complete integration adapter-order test structure from MVP plan`
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

- Date: 2026-02-17
- Section: Phase 2 adapter behavior
- Decision: Map CIP-30/CIP-95 wallet positive numeric codes by normalized `info` discriminator and accept Blockfrost payloads from direct object or nested `response.data`.
- Reason: Wallet `code` values overlap across sign/send families; Blockfrost errors commonly arrive wrapped by HTTP clients.
- Impact: Deterministic table mappings are preserved while handling real-world wrapped payload shapes.

- Date: 2026-02-17
- Section: Phase 3 node string heuristics
- Decision: Prioritize inner ledger tag regex matches before wrapper fallback so `ApplyTxError`/`ShelleyTxValidationError` map to specific codes when possible, else `TX_LEDGER_VALIDATION_FAILED`.
- Reason: Wrapper tags are containers and should not override specific failures (`BadInputsUTxO`, `ValueNotConservedUTxO`, etc.).
- Impact: Fixture-backed node mappings are deterministic while preserving a safe fallback for ambiguous wrapper-only errors.

- Date: 2026-02-17
- Section: Phase 3 mesh unwrap adapter
- Decision: Add `fromMeshError` as the first default adapter and delegate recursively extracted nested payloads through wallet, Blockfrost, then node adapters; preserve original wrapped `raw` and tag `meta.meshUnwrapped=true`.
- Reason: Mesh/provider wrappers can nest actionable payloads (for example `cause.response.data`) deep enough that direct adapter scans miss deterministic mappings.
- Impact: Provider/wallet deterministic mappings now win before node-string heuristics on wrapped mixed-stack errors.

- Date: 2026-02-17
- Section: Phase 4 mapping branch tests
- Decision: Expand adapter unit coverage to include explicit Blockfrost 400/403/404 branches, non-http status null behavior, wallet positive-code disambiguation (`1` sign vs submit by `info`), and unknown wallet combo fallback.
- Reason: Ensure each deterministic mapping branch in MVP tables and known null-return branch is explicitly regression-tested.
- Impact: Phase 4 mapping branch unit-test gate is now complete with broader branch-level confidence.

## Testing Notes
- Last run: 2026-02-17
- Result: Pass (20/20 tests)
- Notes: `npm test` using Node test runner with `--experimental-strip-types`; added branch tests for Blockfrost explicit 400/403/404, non-http status null behavior, and wallet positive-code disambiguation + unknown combo fallback.

## Commit Log
- 2026-02-17: `4902835` - Build Phase 1 core types and normalizer.
- 2026-02-17: `7645082` - Implement Phase 2 wallet + Blockfrost adapters and table-driven mapping tests.
- 2026-02-17: `1778390` - Update progress log after Phase 2 commit.
- 2026-02-17: `c475253` - Add node string heuristic adapter and fixture-backed tests.

## Next
- [ ] Read `mvp.md` and this file at start of the next cycle.
- [ ] Implement next unchecked item in active phase.
- [ ] Run relevant tests until passing.
- [ ] Update this file.
- [ ] If the build is completed as per MVP, let the user know it is ready for real-time testing.
- [ ] Commit.
