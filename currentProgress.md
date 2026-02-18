# Current Progress

## Project
- Name: Cardano Error Normalizer MVP
- Source plan: `mvp.md`
- Last updated: 2026-02-18

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
- [x] `/test` fixture and test file structure matches plan.
- [x] `/examples/mesh-blockfrost-eternl.ts` added.

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
- Status: `Completed`
- [x] Mapping branch unit tests complete.
- [x] Integration adapter-order tests complete.
- [x] Example integration snippet complete.
- [x] README quickstart + mapping docs complete.
- [x] Full test suite passing.
- [x] Release candidate ready (`v0.1.0`).

### 6) Acceptance Criteria Checklist
- [x] `normalize()` always returns valid `CardanoAppError`.
- [x] Deterministic wallet and Blockfrost mappings pass.
- [x] Blockfrost `402` -> `QUOTA_EXCEEDED`.
- [x] Blockfrost `418` -> `FORBIDDEN` + `meta.blockfrostReason="auto_banned"`.
- [x] Mesh-wrapped errors unwrap before heuristic fallback.
- [x] Node fixtures map for `BadInputsUTxO`, `OutputTooSmallUTxO`, `ValueNotConservedUTxO`, deserialise/decoder failures.
- [x] Wrapper errors map via inner extraction or `TX_LEDGER_VALIDATION_FAILED`.
- [x] Unknown shapes preserve `raw` and map to `UNKNOWN`.
- [x] CI tests pass (local `npm test` gate and repository CI workflow configured).

## Current Build Focus
- Active section: `DX follow-up React compatibility cleanup`
- Current task: `Agent-owned: release-readiness follow-up for DX fixes`
- Blockers: `none`

## DX Follow-up Task Queue (Open)

### A) React Auto-Bindings (Primary Remaining DX Gap)
- [x] Replace manual `config.hooks` requirement in `useCardanoError` with runtime React auto-bindings in `src/react/*`.
- [x] Remove strict manual-runtime throw path from `defaultHookBindings()` once auto-bindings are wired.
- [x] Keep `createUseCardanoOp` compatibility export for advanced/custom integrations.

### B) API/Compatibility Cleanup
- [x] Decide final public shape for `UseCardanoErrorConfig.config.hooks` (remove vs keep as optional compatibility override).
- [x] If retained, ensure default path is bindingless and override path is explicitly documented as advanced-only.
- [x] Add migration note for consumers currently passing manual hook bindings.

### C) Test Coverage for React DX Closure
- [x] Add/adjust tests validating `useCardanoError` works without `config.hooks`.
- [x] Add regression test ensuring compatibility behavior for `createUseCardanoOp` remains intact.
- [x] Run full gates after React changes: `npm test`, `npm run typecheck`, `npm run build`.

### D) Documentation + Progress Alignment
- [x] Update README React section to match final runtime behavior (no bindings-first footgun).
- [x] Ensure README and source code show the same recommended React usage path.
- [x] Record final DX closure decision + evidence in the Decisions Log after implementation.

### E) Release Readiness for DX Fixes
- [ ] If API surface changes, update versioning/release notes accordingly.
- [ ] Run package validation (`npm pack --dry-run`) using `/tmp` npm cache strategy if needed.
- [ ] Prepare publish-ready checklist entry once React auto-bindings gap is closed.

## Decisions Log
- Date: 2026-02-18
- Section: DX follow-up documentation/progress alignment closure
- Decision: Align React README guidance with source runtime behavior by documenting the exact default hook auto-binding path (`globalThis.React`) and keeping `config.hooks` as the advanced compatibility fallback when runtime globals are unavailable.
- Reason: The remaining open item in section D required removing ambiguity between docs and implementation so the recommended `useCardanoError` path reflects real runtime expectations.
- Impact: Section D is now complete, React usage guidance is source-accurate, and active work can move to section E release-readiness tasks.
- Test evidence: `npm test` -> `69/69` passing.

- Date: 2026-02-18
- Section: DX follow-up test coverage closure (full validation gates)
- Decision: Execute and record full repository validation gates after React DX changes: `npm test`, `npm run typecheck`, `npm run build`.
- Reason: The remaining unchecked item in section C required proving that React auto-binding and compatibility updates hold under full project gates, not only focused tests.
- Impact: Section C is now complete with repository-wide evidence, and the next execution target moves to documentation/progress alignment tasks.
- Test evidence: `npm test` -> `69/69` passing; `npm run typecheck` -> passing; `npm run build` -> passing.

- Date: 2026-02-18
- Section: DX follow-up API/compatibility cleanup (`UseCardanoErrorConfig.config.hooks` public shape)
- Decision: Keep `config.hooks` as an optional advanced compatibility override and document the recommended default path as runtime React auto-binding.
- Reason: Runtime auto-binding removes the default integration footgun, while test harnesses/custom runtimes still need an explicit hook-binding injection path.
- Impact: Public React API remains backward compatible; standard consumers can omit `config.hooks`, and advanced users retain manual binding control with explicit guidance.
- Test evidence: `npm test -- test/react.index.test.ts` -> `7/7` passing.

- Date: 2026-02-18
- Section: DX follow-up execution (React auto-bindings in `useCardanoError`)
- Decision: Remove the hard manual `config.hooks` requirement by auto-resolving hook bindings from runtime React when available, while keeping `config.hooks` as an explicit compatibility override and preserving `createUseCardanoOp` exports.
- Reason: The highest-priority open DX item was to remove bindings-first friction for `useCardanoError` users without breaking advanced/custom integrations.
- Impact: `useCardanoError` now works without `config.hooks` when runtime React hooks are available; legacy/custom hook injection remains supported.
- Test evidence: `npm test -- test/react.index.test.ts` -> `7/7` passing (including runtime auto-bindings regression case); `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: DX follow-up task planning
- Decision: Add an explicit task queue in `currentProgress.md` for closing the remaining React DX gap (auto-bindings) and dependent validation/doc/release work.
- Reason: Repository fact-check confirms major DX items are implemented, but runtime React hook bindings still require manual wiring; tracking needs concrete execution tasks rather than a generic note.
- Impact: Work is now sequenced into implementation, compatibility, testing, docs, and release-readiness tasks to drive the next PR(s) without ambiguity.
- Test evidence: Planning-only update (no runtime code changes).

- Date: 2026-02-18
- Section: Post-release maintenance (verification fixture parity with observed/runtime-relevant Blockfrost not-found paths)
- Decision: Add a dedicated Blockfrost verification fixture row for `404 Not Found` in `test/fixtures/verification/blockfrost.json`.
- Reason: The Blockfrost adapter and mapping table already classify `404` as `NOT_FOUND`, but the verification fixture pack did not include an explicit regression row for this status.
- Impact: Verification fixture coverage now includes the full common Blockfrost 4xx spread used by runtime flows (`400/402/403/404/418/425/429`).
- Test evidence: `npm test -- test/verification.fixtures.test.ts` -> `4/4` passing.

- Date: 2026-02-18
- Section: Post-release maintenance (verification fixture parity with observed runtime Blockfrost auth errors)
- Decision: Add a dedicated Blockfrost verification fixture row for `403 Invalid project token` in `test/fixtures/verification/blockfrost.json`.
- Reason: The runtime fixture pack already contains observed `BF-403`, but the verification fixture suite lacked this explicit auth-status row.
- Impact: Verification fixtures now cover observed Blockfrost auth failure semantics (`403` -> `UNAUTHORIZED`) in addition to quota/rate/mempool/internal mappings.
- Test evidence: `npm test -- test/verification.fixtures.test.ts` -> `4/4` passing.

- Date: 2026-02-18
- Section: Post-release maintenance kickoff (runtime fixture provenance contract)
- Decision: Require `real-world-errors` fixtures to include provenance metadata (`observedAt`, `capturedFrom`) and enforce unique fixture IDs via `test/real-world-payloads.test.ts`.
- Reason: Active maintenance work needs deterministic tracking for when/where runtime payload samples were observed, so future mapping changes can be audited against concrete evidence.
- Impact: New runtime fixture additions now fail fast if provenance fields are missing or IDs collide, improving regression hygiene during ongoing post-release monitoring.
- Test evidence: `npm test` -> `68/68` passing; `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: DX status fact-check reconciliation
- Decision: Validate the external DX status write-up against the live repository and mark stale claims as corrected in-project state.
- Reason: The referenced summary correctly captured earlier state but no longer reflects current `main`; several previously "not done" DX items are now implemented.
- Impact: Team tracking should treat these items as complete: React peer dependency is present, root API exports preset helpers, README documents direct `useCardanoError` usage and presets, and normalizer instances support scoped defaults via `createNormalizer({ defaults })`/`withDefaults(...)`. Remaining gap is React auto-hook imports (bindings still manual).
- Test evidence: File-level verification against `package.json`, `README.md`, `src/index.ts`, `src/react/index.ts`, `src/core/normalize.ts`, `src/config/errors.ts`, and `src/utils/safeProvider.ts`.

- Date: 2026-02-18
- Section: Post-publish documentation and verification closeout
- Decision: Reconcile progress state with shipped reality by closing the release-readiness section and moving active focus to post-release maintenance.
- Reason: `@gulla0/cardano-error-normalizer@0.2.0` is already published and live verification is complete, but this file still listed pending release-readiness steps.
- Impact: Workflow state is now consistent with the actual release/publish status, preventing duplicate publish actions in future cycles.
- Test evidence: `npm test` -> `68/68` passing; `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: Real-time stack verification completion (Mesh + Blockfrost + Eternl)
- Decision: Accept live verification results as complete after confirming submit-path CIP-30 payload `{ code: -2, info: "unknown error submitTx" }` maps to `WALLET_SUBMIT_FAILURE`, sign decline `{ code: 2, info: "user declined sign tx" }` maps to `WALLET_SIGN_USER_DECLINED`, and provider query `400` maps to `BAD_REQUEST`.
- Reason: Human-provided runtime payload evidence demonstrated expected normalized outputs in frontend flows.
- Impact: Verification checklist is now complete and mapping behavior is validated against live stack outcomes beyond fixture-only tests.
- Test evidence: Human runtime report marked `PASS` with expected/actual code parity for submit + sign and provider query confirmation.

- Date: 2026-02-18
- Section: npm publish execution (`@gulla0/cardano-error-normalizer@0.2.0`)
- Decision: Publish from repository root using `NPM_CONFIG_CACHE=/tmp/.npm-cache npm publish --access public` to bypass local `~/.npm` cache permission issues.
- Reason: Default npm cache path had root-owned files and blocked publish with `EPERM`.
- Impact: Package is now live on npm (`npm view @gulla0/cardano-error-normalizer version` => `0.2.0`) and installable by consumers.
- Test evidence: `npm run typecheck` pass, `npm test` pass (`68/68`), successful npm registry version lookup post-publish.

- Date: 2026-02-18
- Section: Real-time verification follow-up (wallet submit CIP-30 APIError disambiguation)
- Decision: Treat wallet `APIError` `code=-2` as `WALLET_SUBMIT_FAILURE` when submit intent is explicit (`ctx.source="wallet_submit"` or `ctx.stage="submit"`) or when `info` indicates `submitTx`; preserve existing `WALLET_INTERNAL` mapping for non-submit contexts.
- Reason: Real-stack validation showed submit-path CIP-30 payloads (`code=-2`, `info="unknown error submitTx"`) were being classified as internal sign errors, which is too broad for submit UX/retry behavior.
- Impact: Submit failures now classify as `WALLET_SUBMIT_FAILURE` in submit contexts while existing sign/internal mappings stay stable.
- Test evidence: `npm test` -> `68/68` passing (new wallet adapter + normalizer integration assertions), `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: Verification remediation execution checklist #7 (README alignment)
- Decision: Update `README.md` mapping docs to include `DataSignError` + `PaginateError` wallet rows, add explicit Blockfrost key-based parsing note (`status_code/error/message` order agnostic), and add preset usage example showing Mesh `fetchAddressUTxOs` versus CIP-30 `getUtxos`.
- Reason: Close the final agent-owned verification checklist section and align docs/examples with implemented preset and adapter behavior.
- Impact: Public docs now match shipped normalization taxonomy and layer-correct preset method naming, reducing integration drift.
- Test evidence: `npm test` -> `65/65` passing; `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: Verification remediation execution checklist #6 (fixture-driven regression locking)
- Decision: Add dedicated verification fixture packs under `test/fixtures/verification` (`blockfrost.json`, `wallet.json`, `nodeStrings.json`, `mesh.json`) and add `test/verification.fixtures.test.ts` to assert adapter mappings plus `inferErrorMeta` expectations per fixture row.
- Reason: Close the required verification fixture section with explicit coverage for Blockfrost key-based parsing (`400/402/418/425/429/500`, shuffled nested keys), wallet DataSign/Paginate/CIP-95 rows, conservative node string buckets, and mesh unwrapping behavior.
- Impact: Verification behavior is now regression-locked with centralized fixture data, including cross-checks that metadata inference remains consistent with adapter-level normalization.
- Test evidence: `npm test` -> `65/65` passing; `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: Verification remediation execution checklist #5 (taxonomy + wallet adapter updates)
- Decision: Add required taxonomy codes in `src/codes.ts` (`WALLET_DATA_SIGN_PROOF_GENERATION`, `WALLET_DATA_SIGN_ADDRESS_NOT_PK`, `WALLET_DATA_SIGN_USER_DECLINED`, `WALLET_PAGINATION_OUT_OF_RANGE`), extend `fromWalletError` with DataSign family detection and Paginate `{maxSize}` handling, and annotate CIP-95 `DeprecatedCertificate` mappings with `meta.cip95DeprecatedCertificate=true`.
- Reason: Close the next verification checklist section with spec-aligned wallet-family coverage and explicit CIP-95 provenance metadata while preserving existing TxSign/TxSend behavior.
- Impact: Wallet normalization now handles DataSign and Paginate failures with dedicated internal codes, keeps CIP-95 classification explicit in metadata, and preserves deterministic mapping behavior for legacy fixtures.
- Test evidence: `npm test` -> `61/61` passing (expanded wallet fixture rows + disambiguation assertions), `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: Verification remediation execution checklist #4 (meta inference enrichment)
- Decision: Add `src/core/analyzers.ts` with `inferErrorMeta(err)` heuristics for key-based Blockfrost detection (`status_code` in nested shapes), CIP numeric wallet detection (`code` + `info`), and node ledger-pattern strings; update `normalizeError` to merge metadata as `meta: { ...core.meta, ...heur }` while preserving explicit caller provenance for `source`/`stage`.
- Reason: Close the checklist requirement to enrich diagnostics through `meta` only without mutating explicit context provenance from caller inputs.
- Impact: `normalizeError` now consistently adds inferred diagnostics (`inferredProvider`, `inferredKind`, `httpStatus`, `blockfrostReason`) on top of adapter metadata and keeps caller-supplied provenance stable.
- Test evidence: `npm test` -> `61/61` passing (new `test/core.analyzers.test.ts` + `normalizeError` merge/provenance assertions), `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: Verification remediation execution checklist #3 (preset layer separation)
- Decision: Add `meshProviderPreset` (`src/presets/meshProvider.ts`) and `cip30WalletPreset` (`src/presets/cip30Wallet.ts`) as thin `withErrorSafety` wrappers with method-to-context mapping (`submitTx` vs `fetchAddressUTxOs` for Mesh, `getUtxos/signTx/signData/submitTx` for CIP-30), then export both from root API.
- Reason: Close the next verification checklist section by separating provider and wallet method naming semantics so preset usage is layer-correct and reusable.
- Impact: Consumers can opt into deterministic context mapping without hand-writing `ctx` resolvers, and the new presets enforce the verified method boundaries from the report.
- Test evidence: `npm test` -> `56/56` passing (includes new `test/presets.test.ts` coverage).

- Date: 2026-02-18
- Section: Verification remediation execution checklist #1 (React DX update)
- Decision: Switch `./react` primary hook to `useCardanoError({ operation, defaults, config })`, add returned `normalize(raw, overrideCtx)` helper with `{ ...defaults, ...overrideCtx }` merge semantics, retain `createUseCardanoOp` compatibility exports, add `peerDependencies.react >=16.8.0`, and update README React usage to remove bindings-first flow plus document non-React peer behavior.
- Reason: Close the next agent-owned checklist section with spec-aligned API shape and package metadata while keeping existing compatibility helpers available.
- Impact: React consumers now use a bindingless options API with built-in normalize helper and merged context defaults; package metadata now advertises React peer expectations for `./react` consumers.
- Test evidence: `npm test` -> `53/53` passing; `npm run typecheck` -> passing.

- Date: 2026-02-18
- Section: Verification remediation section 0 (API shape normalization)
- Decision: Implement `createNormalizer({ config, defaults })`, add `Normalizer.withDefaults(moreDefaults)`, and update `normalizeError(raw, ctx?, config?)` to support scoped context defaults and per-call config without mutating singleton defaults. Backward compatibility for legacy `createNormalizer(config)` calls is preserved.
- Reason: Verification follow-ups require strict separation of provenance (`NormalizeContext`) and behavior flags (`NormalizeConfig`) before moving to React DX and preset layers.
- Impact: Call sites can now centralize default provenance per normalizer instance, fork scoped instances safely with `withDefaults`, and apply one-off normalization config through `normalizeError` while existing usage continues to pass.
- Test evidence: `npm test` -> `52/52` passing.

- Date: 2026-02-18
- Section: Verification report remediation planning
- Decision: Add a dedicated implementation guide at `verification-followup-instructions.md` and treat `Research Dump/verification-3rdParty-errors.md` as the verification source of truth for all follow-up changes.
- Reason: The report includes exact spec corrections and fixture/test requirements that must be tracked independently from prior DX v2 progress.
- Impact: Active work now has a concrete checklist for API shape, presets, taxonomy, heuristics, fixtures/tests, and docs updates, with explicit traceability to verification findings.

- Date: 2026-02-18
- Section: DX v2 validation gate rerun
- Decision: Run publish/readiness validation gates after DX v2 implementation and use `NPM_CONFIG_CACHE=/tmp/.npm-cache` for `npm pack --dry-run` to avoid host-level `~/.npm` cache permission issues.
- Reason: Close the next agent-owned section from the workflow (`npm test`, `npm run typecheck`, `npm pack --dry-run`) with deterministic pass/fail evidence.
- Impact: All DX v2 validation gates are passing; remaining next step is human-owned real-time stack validation.

- Date: 2026-02-18
- Section: DX v2 README usage alignment
- Decision: Update README DX guidance to prefer direct `useCardanoError` import from `@gulla0/cardano-error-normalizer/react`, document `normalizerConfig` (`debug`, `parseTraces`) usage, and add a resolution-hint rendering snippet for UI surfaces.
- Reason: Complete the next agent-owned DX docs section so usage examples align with the shipped React and smart-normalizer APIs.
- Impact: Documentation now reflects the current DX v2 entrypoints and shows how to surface actionable `resolution` hints in app UX.

- Date: 2026-02-18
- Section: DX v2 matcher/debug/wrapper/react coverage expansion
- Decision: Add targeted tests across `core.normalize`, `withErrorSafety`, and `react/index` for remaining smart matcher branches, trace parsing cap/trim behavior, debug logging fallback safety, normalizer precedence rules, and React safety transition paths (`normalizerConfig`, custom normalizer + arg-aware `ctx` callbacks).
- Reason: Close the next agent-owned DX v2 testing section and lock critical DX v2 behavior with explicit regressions.
- Impact: Coverage increased from 42 to 49 passing tests with no runtime code changes, reducing regression risk before docs and final publish-gate reruns.

- Date: 2026-02-18
- Section: DX v2 React subpath export alignment
- Decision: Point package subpath `./react` to `dist/react/index.*` and make `src/react/index.ts` re-export `createUseCardanoOp` types/functions for compatibility.
- Reason: Close the next agent-owned packaging section so direct React APIs (`useCardanoError`, `executeWithSafety`) are reachable through the published subpath without dropping existing `createUseCardanoOp` usage.
- Impact: Optional React surface is now consolidated behind one barrel entrypoint, and peer strategy remains framework-agnostic because no `react` dependency/peer dependency was introduced in the core package metadata.

- Date: 2026-02-18
- Section: DX v2 direct React entrypoint surface
- Decision: Add `src/react/index.ts` with `useCardanoError(config)` as a config-driven hook wrapper over `createUseCardanoOp`, plus `executeWithSafety(operation, options)` for normalized async boundaries outside provider proxies.
- Reason: Complete the next agent-owned DX v2 section by exposing direct React-flow APIs without forcing consumers to assemble hook factories for common usage.
- Impact: React integrations now have a single-entry ergonomic surface for hook state and safe async execution while retaining configurable normalizer precedence (`normalizer` -> `normalizerConfig` -> global default).

- Date: 2026-02-18
- Section: DX v2 safe provider contract wiring
- Decision: Extend `withErrorSafety` options with `normalizerConfig?: Partial<NormalizerConfig>` and resolve normalizer precedence as `normalizer` override -> per-wrapper smart normalizer from `normalizerConfig` -> shared `globalNormalizer`, while preserving normalized rethrow behavior for both async rejections and sync throws.
- Reason: Close the next agent-owned DX v2 section by wiring provider wrappers to the new smart normalizer/config contract without forcing consumers to manually instantiate normalizers.
- Impact: Wrapped providers can opt into debug/trace parsing per wrapper instance, and all thrown failures are consistently normalized `CardanoAppError` values with `safeProvider` metadata.

- Date: 2026-02-18
- Section: DX v2 smart normalizer core
- Decision: Add `src/core/normalize.ts` with `createSmartNormalizer()` to layer message-based fallback matchers, automatic resolution hint attachment, optional trace metadata enrichment (`parseTraces`), and guarded debug console-group logging (`debug`) on top of the existing adapter-driven normalizer.
- Reason: Complete the next agent-owned DX v2 section by centralizing smart normalization behavior before wiring wrappers/hooks to the upgraded contract.
- Impact: `globalNormalizer` now uses the smart pipeline, normalized outputs receive actionable resolution hints by default, and debug-mode telemetry is available without risking runtime crashes.

- Date: 2026-02-18
- Section: DX v2 resolution lookup table
- Decision: Add `src/core/resolutions.ts` with a deterministic code-to-resolution mapping and `getResolutionForCode(code)` helper that returns a defensive copy of `steps`.
- Reason: The next agent-owned DX v2 section required a centralized hint source before integrating smart normalization hint attachment.
- Impact: Resolution hints are now available as reusable package API and can be safely attached without shared mutable state.

- Date: 2026-02-18
- Section: DX README modernization
- Decision: Rework README integration guidance around `withErrorSafety` as the default path, with explicit migration examples and optional React subpath usage via `createUseCardanoOp`.
- Reason: The next agent-owned DX task required removing manual `try/catch + normalize` boilerplate from the recommended path and documenting the stable wrapper/hook ergonomics.
- Impact: Documentation now matches the implemented DX surface (`globalNormalizer`, `normalizeError`, `withErrorSafety`, `./react` entrypoint), reducing integration friction for new adopters.

- Date: 2026-02-18
- Section: DX React packaging scope
- Decision: Keep the core package framework-agnostic and deliver React helpers via a sibling package/entrypoint instead of adding a React peer dependency to the core package.
- Reason: Preserve minimal core dependency surface and avoid forcing React constraints on non-React consumers.
- Impact: Core DX work can proceed with `globalNormalizer` + provider interception now, while React hook delivery is isolated to a follow-on package boundary.

- Date: 2026-02-18
- Section: DX React hook entrypoint implementation
- Decision: Add `src/react/useCardanoOp.ts` as `createUseCardanoOp(bindings)` and expose it through package subpath export `./react`.
- Reason: Complete React-flow normalization behavior (`loading/data/error/reset` + normalized throw-through) while preserving a framework-agnostic core dependency surface.
- Impact: React consumers can wire a hook boundary from an isolated entrypoint without introducing a direct `react` dependency into the root package runtime.

- Date: 2026-02-18
- Section: DX interception and normalize helpers
- Decision: Add `src/config/errors.ts` (`globalNormalizer`, `normalizeError`) and `src/utils/safeProvider.ts` (`withErrorSafety`) with proxy method-level normalization and metadata annotation.
- Reason: Move normalization from callsite boilerplate to reusable wrappers and a singleton default normalizer.
- Impact: Provider method failures can now be normalized centrally with consistent context and `meta.safeProvider*` diagnostics.

- Date: 2026-02-18
- Section: DX architecture direction
- Decision: Adopt an inversion-of-control DX strategy with three pillars: `withErrorSafety` proxy wrapper for providers, `useCardanoOp` hook for wallet/UI flows, and a global normalizer singleton exported from one config module.
- Reason: Manual per-call `try/catch + normalize` integration is high-friction and causes boilerplate fatigue, increasing the risk that error normalization is skipped in new code.
- Impact: Integration shifts from manual wrapping at every callsite to standardized wrappers/helpers, reducing repeated code and making normalized errors the default behavior.

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

- Date: 2026-02-17
- Section: Phase 4 integration adapter-order tests
- Decision: Split adapter-order checks into dedicated `test/normalizer.integration.test.ts` and add an ambiguous payload precedence test confirming wallet mapping wins before Blockfrost in default adapter order.
- Reason: Align `/test` structure with MVP plan while asserting runtime adapter precedence against mixed-shape payloads.
- Impact: Integration test gate for adapter ordering is now explicitly covered and passing in the full suite.

- Date: 2026-02-17
- Section: Phase 4 example integration snippet
- Decision: Add `/examples/mesh-blockfrost-eternl.ts` with a Mesh-style wrapped Blockfrost `402` payload and normalization context for a Blockfrost + Eternl path.
- Reason: Provide a minimal runnable reference for the primary MVP integration flow while demonstrating unwrap-first adapter behavior and fingerprint output.
- Impact: Example gate in Phase 4 is complete and users now have an end-to-end usage snippet to bootstrap integration.

- Date: 2026-02-17
- Section: Phase 4 README documentation
- Decision: Add root `/README.md` with quickstart, default adapter order, and canonical wallet/Blockfrost mapping tables plus node heuristic mapping summary.
- Reason: Close the final docs deliverable in Phase 4 with a practical onboarding path tied directly to MVP mapping behavior.
- Impact: Documentation gate for Phase 4 is now complete; only CI verification and release-candidate readiness remain.

- Date: 2026-02-17
- Section: Phase 4 release gate
- Decision: Treat `npm test` (21/21 pass) as the CI-equivalent quality gate for this cycle because no `.github/workflows` configuration exists in the repository.
- Reason: The initiation workflow requires section testing before progress updates and commit; repository-local test execution is the only available automated gate.
- Impact: Phase 4 is closed as `Completed` and the MVP is marked ready for real-time testing.

- Date: 2026-02-17
- Section: Next section: repository CI workflow
- Decision: Add `.github/workflows/ci.yml` to run `npm ci` and `npm test` on `push` (`main`/`master`) and `pull_request` using Node 22 with npm cache.
- Reason: The next non-blocked agent-owned item was CI enforcement for push/PR quality gates.
- Impact: Test execution is now enforced in GitHub Actions, reducing regression risk beyond local-only checks.

- Date: 2026-02-17
- Section: Post-MVP publish-readiness package metadata
- Decision: Use ESM-only publish configuration with `publishConfig.access=public`, `engines.node>=18`, package export/type entrypoints at `src/index.ts`, and a `prepublishOnly` test gate while keeping runtime/type transpilation out of this section.
- Reason: Human Task 1 confirmed public ESM-only constraints and Node/TypeScript minimums; this section focuses on publish metadata + release files without expanding build-tool dependencies.
- Impact: Repository is now package-publish ready at metadata level and safely gated by tests before publish.

- Date: 2026-02-17
- Section: Repository hygiene
- Decision: Add a root `.gitignore` covering npm credentials, dependency/build artifacts, environment files, logs, and OS clutter.
- Reason: Prevent accidental commits of secrets and generated/local files during post-MVP hardening.
- Impact: Git status now stays focused on meaningful source/documentation changes.

- Date: 2026-02-17
- Section: Post-MVP changelog documentation
- Decision: Add root `CHANGELOG.md` with `0.1.0` entry including taxonomy v1 and explicitly stated MVP known limitations.
- Reason: Close the remaining agent-owned post-MVP documentation deliverable and provide a stable release-history anchor before human-gated real-world fixture expansion.
- Impact: MVP definition-of-done changelog requirement is now satisfied and release discussion can reference a concrete taxonomy snapshot.

- Date: 2026-02-18
- Section: Post-MVP real-world payload hardening
- Decision: Add fixture-backed regression coverage for nine user-provided Mesh + Blockfrost + Eternl payloads and harden Blockfrost parsing to accept SDK-style `status_code` + `error` payloads when `message` is absent.
- Reason: Human Task 2 delivered real-world samples including a Blockfrost SDK shape that omitted `message`; fixture-backed regression locking was required before moving to release approval.
- Impact: Regression protection now includes real-world payloads while preserving deterministic MVP mappings; suite increased to 23/23 passing tests.

- Date: 2026-02-18
- Section: Human Task 3 release decision and publish window
- Decision: Keep `v0.1.0` scope unchanged but reject release as publish-ready until three pre-publish blockers are fixed: replace placeholder npm scope/name, implement a supported TypeScript consumer contract (tsconfig + TypeScript dependency + build/types output), and remove absolute local filesystem paths from published docs.
- Reason: Human approval response confirmed MVP feature scope is acceptable while identifying packaging/distribution blockers that could break consumers or leak local-path references.
- Impact: Release is now explicitly gated by publish-readiness remediation; next agent-owned work is packaging hardening and docs cleanup before final publish approval.

- Date: 2026-02-18
- Section: Post-MVP publish blocker remediation
- Decision: Replace placeholder package name with publishable default `cardano-error-normalizer`, add TypeScript contract (`tsconfig.json`, `tsconfig.build.json`, `typescript` dev dependency, emitted `dist` JS + `.d.ts` exports), and clean absolute local paths from fixture docs.
- Reason: Resolve all technical blockers identified in Human Task 3 while preserving ESM-only packaging and existing runtime behavior.
- Impact: Publish gates now pass (`npm run typecheck`, `npm test`, `npm pack --dry-run`), and package tarball contains only expected release files + built artifacts.

- Date: 2026-02-18
- Section: Final npm package scope confirmation
- Decision: Apply human-confirmed publish identity `@gulla0/cardano-error-normalizer` in package metadata and README install/import examples.
- Reason: Human provided the final npm org/user scope required by Task 3 blocker resolution.
- Impact: Package identity is now final and aligned across metadata/docs for publish.

- Date: 2026-02-18
- Section: GitHub repository push readiness
- Decision: Add explicit human + agent Task 4 for remote setup and first push/CI verification.
- Reason: Repository has no configured git remote yet, so GitHub publication requires a human-owned remote selection step before agent push execution.
- Impact: Push ownership and execution gates are now clear, with CI verification included as part of completion.

- Date: 2026-02-18
- Section: GitHub repository push execution
- Decision: Configure `origin` as `https://github.com/gulla0/cardano-error-normalizer.git`, push `main`, and verify CI run status via GitHub Actions API.
- Reason: Human Task 4 provided remote URL, confirmed branch target (`main`), and approved push execution.
- Impact: Remote publication handoff is complete and CI is verified on the pushed head commit.

- Date: 2026-02-18
- Section: DX v2 core error model expansion
- Decision: Add `ErrorResolution` type and extend `CardanoAppError` with `originalError` and optional `resolution`, while extending `NormalizerConfig` with `debug` and `parseTraces` flags defaulted to `false`.
- Reason: Start DX v2 by widening the canonical error/config contract before adding the new resolution table and smart normalizer pipeline.
- Impact: Core types are now ready for resolution-hint attachment and debug/trace behaviors without breaking existing normalization flows.

## Testing Notes
- Last run: 2026-02-18
- Result: Pass (`npm test -- test/react.index.test.ts` -> `7/7`; `npm run typecheck` -> passing)
- Notes: Added runtime React auto-bindings coverage for `useCardanoError` without `config.hooks`; compatibility export path remains covered.

## Commit Log
- 2026-02-17: `4902835` - Build Phase 1 core types and normalizer.
- 2026-02-17: `7645082` - Implement Phase 2 wallet + Blockfrost adapters and table-driven mapping tests.
- 2026-02-17: `1778390` - Update progress log after Phase 2 commit.
- 2026-02-17: `c475253` - Add node string heuristic adapter and fixture-backed tests.
- 2026-02-17: `b408847` - Add GitHub Actions CI workflow for npm test.
- 2026-02-17: `970a4f5` - Prepare package publish metadata for public ESM release.
- 2026-02-17: `8df3a17` - Add project `.gitignore` and update progress log.
- 2026-02-17: `ee53fca` - Add `CHANGELOG.md` entry for taxonomy v1 and sync progress.
- 2026-02-18: `ac2cccf` - Refine wallet `APIError -2` submit-context mapping and add regression coverage.

## Next
- [x] Read `mvp.md` and this file at start of the next cycle.
- [x] Add `src/config/errors.ts` singleton export (`globalNormalizer`) and route internal helper usage through it.
- [x] Add `src/utils/safeProvider.ts` with generic `withErrorSafety<T extends object>` proxy wrapper for async provider methods.
- [x] Add tests for proxy behavior: function wrapping, non-function property passthrough, context metadata propagation, and preserved return values.
- [x] Add `src/react/useCardanoOp.ts` and type-safe hook tests for loading/data/error/reset behavior with normalized throw-through.
- [x] Decide packaging model for React hook delivery (`react` peer dependency in main package vs dedicated optional entrypoint).
- [x] Update README with DX-first integration path and migration examples from manual `try/catch` to wrappers/hooks.
- [x] Add a repository CI workflow (`.github/workflows`) to enforce `npm test` on push/PR.
- [x] Finalize package publish readiness blockers from Human Task 3 (`package` scope/name, TS build/types contract, doc path cleanup).
- [x] Add `CHANGELOG.md` entry for taxonomy v1 and known limitations.
- [x] Run real-time integration testing against Mesh + Blockfrost + Eternl stack.
- [x] Push repository to GitHub remote and verify Actions CI run on latest commit.
- [x] Add regression fixtures/tests for any newly observed real-world errors.
- [x] Add `npm run typecheck` (no special hacks) and confirm pass.
- [x] Re-run publish gate checklist (`npm pack`, `npm test`, `npm run typecheck`) before publish.
- [x] DX v2: expand core error model in `src/types.ts` (`ErrorResolution`, `CardanoAppError.originalError`, `CardanoAppError.resolution`, `NormalizerConfig.debug/parseTraces`).
- [x] DX v2: add `src/core/resolutions.ts` lookup table and `getResolutionForCode(code)` helper.
- [x] DX v2: add `src/core/normalize.ts` as the central smart normalizer (message extraction, matcher strategy, hint attachment, debug console group logs).
- [x] DX v2: wire `withErrorSafety` to new normalizer/config contract and ensure normalized throws for wrapped provider methods.
- [x] DX v2: add React direct hook entrypoint `src/react/index.ts` with `useCardanoError(config?)` and `executeWithSafety`.
- [x] DX v2: align package exports for subpath imports (`./react`) and verify peer dependency strategy for optional React usage.
- [x] DX v2: add tests for normalization matcher coverage, resolution mapping, debug-mode non-crash behavior, wrapper propagation, and React hook state transitions.
- [x] DX v2: update README usage to show direct `cardano-error-normalizer/react` hook import, debug mode usage, and actionable hint rendering.
- [x] DX v2: run validation gates (`npm test`, `npm run typecheck`, `npm pack --dry-run`) after implementation.
- [x] Execute verification remediation checklist in `verification-followup-instructions.md`.
- [x] Implement missing wallet families from verification report (`DataSignError`, `PaginateError`) and add required taxonomy codes.
- [x] Align preset separation and naming (`meshProviderPreset` vs `cip30WalletPreset`) per verification report.
- [x] Add/extend `inferErrorMeta` and enforce meta-only enrichment merge behavior.
- [x] Add verification fixtures and fixture-driven tests for Blockfrost key-based parsing, wallet families, node strings, and mesh wrappers.
- [x] Update README tables/examples for verification-aligned mappings and preset method names.
- [x] Run verification gate after implementation: `npm test`, `npm run typecheck`, `npm pack --dry-run`.
- [x] Post-release maintenance kickoff: enforce provenance metadata and unique IDs for `test/fixtures/real-world-errors.json`.

## Human Work Queue (One At A Time)
Execution protocol:
- Ask the human to complete exactly one human-owned task.
- Wait for their response and collect the required artifacts/answers.
- Log what was received in this file.
- Continue only after required info for that task is complete.

Task 1 (human):
- Provide target package publish scope and constraints:
  - npm org/user name
  - public vs private package
  - required Node/TypeScript support matrix
  - whether dual ESM/CJS is required
- Status: `Completed`
- Received:
  - `npmPackageName`: `@gulla0/cardano-error-normalizer` (final scope confirmed on 2026-02-18; package metadata/docs updated accordingly)
  - `access`: `public`
  - `node`: `>=18`
  - `typescript`: `>=5.2`
  - `moduleFormat`: `esm-only`
- Needed by agent to proceed with publish-readiness implementation.

Task 2 (human):
- Provide real-world error payload samples from Mesh + Blockfrost + Eternl:
  - at least 5 raw failures (wallet, provider, node-mixed if available)
  - context per sample (`source`, `stage`, network, wallet/provider hints)
  - expected behavior if known
- Status: `Completed`
- Received:
  - Artifact: `error-payload-examples.md`
  - Coverage: 9 samples (`BF-403`, `BF-429`, `BF-425`, `BF-ADDR-400`, `M-STAKE-400`, `M-PPVIEW`, `E-USB-REQUESTDEVICE`, `E-NO-CONNECTION`, `E-VALUE-SIZE-5000`)
  - Captured by agent in regression fixture: `test/fixtures/real-world-errors.json`
- Needed by agent to add regression fixtures and validate mappings.

Task 3 (human):
- Confirm release decision:
  - approve v0.1.0 release candidate scope
  - approve changelog wording
  - approve publish timing/window
- Status: `Completed`
- Received:
  - Release scope decision: `Conditional reject for publish readiness` (MVP scope accepted; publishing blocked until fixes are applied).
  - Must-fix blockers:
    - Replace placeholder package name/scope `@your-npm-scope/cardano-error-normalizer` with final real scope.
    - Add supported TypeScript consumer contract: `tsconfig.json`, `typescript` dependency, build step, and proper emitted `.d.ts` target in exports.
    - Remove absolute local paths from published docs (`test/fixtures/README.md`).
  - Changelog decision: `Approved with minor formatting edits requested` (heading spacing/newline polish and packaging/compatibility note; release date should match actual publish date).
  - Publish timing/window: `Publish immediately after blockers are fixed and gates pass` (`npm test`, `npm run typecheck`, `npm pack` validation).

Task 4 (human):
- Create/confirm the target GitHub repository and provide the remote URL (SSH or HTTPS), then approve push execution.
- Status: `Completed`
- Received:
  - `gitRemoteUrl`: `https://github.com/gulla0/cardano-error-normalizer.git`
  - push target branch confirmation: `main`
  - push approval: `yes` (received 2026-02-18)
- Needed by agent to configure `origin`, push commits, and verify CI trigger links.

Task 4 (agent, after human Task 4):
- Configure `origin` remote, push `main`, and confirm GitHub Actions CI is triggered for the latest commit.
- Status: `Completed`
- Completion gate:
  - [x] `git remote -v` shows `origin`.
  - [x] `git push -u origin main` succeeds.
  - [x] CI run URL captured in this file (`https://github.com/gulla0/cardano-error-normalizer/actions/runs/22122385189`).

Task 5 (human):
- Confirm DX packaging scope for React integration:
  - include `useCardanoOp` in this package with `react` peer dependency, or
  - keep core package framework-agnostic and publish React hook from a sibling package/entrypoint
- Status: `Completed`
- Received:
  - Decision: `core package framework-agnostic` + `React hook in sibling package/entrypoint`
  - Approval timestamp: `2026-02-18`

## 2026-02-18 Dependency/CI Follow-Up
- Trigger:
  - GitHub Actions `npm ci` failed with lockfile sync error:
    - `npm ci can only install packages when your package.json and package-lock.json are in sync`
    - `Missing: react@19.2.4 from lock file`
- Agent actions completed:
  - Synced root metadata in `package-lock.json` to match `package.json`:
    - package name aligned to `@gulla0/cardano-error-normalizer`
    - root peer metadata added for `react`
  - Added optional peer metadata in `package.json`:
    - `peerDependenciesMeta.react.optional = true`
  - Mirrored optional peer metadata in `package-lock.json`.
- Verification run results (local):
  - `npm ci --dry-run`: passed
  - `npm ci`: passed
  - `npm run typecheck`: passed
  - `npm test`: passed (`68/68`)
- Follow-up outcome:
  - Commit pushed: `ddcce6e` (`Fix npm ci lockfile sync and mark react peer optional`).
  - GitHub Actions status: `Passed` for the `test` workflow/job on commit `#7`.

## Next Steps (Post-Release)
- Monitor newly observed production/runtime error payloads and append fixture coverage under `test/fixtures/verification`.
- Cut a follow-up patch release only when a mapping bug or compatibility regression is confirmed.
