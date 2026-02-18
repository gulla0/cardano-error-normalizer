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
- Active section: `Post-MVP hardening`
- Current task: `GitHub publish handoff and remote push`
- Blockers: `none`

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

## Testing Notes
- Last run: 2026-02-18
- Result: Pass (`npm run typecheck`, `npm test` 23/23, `npm run build`, `npm pack --dry-run`)
- Notes: Added TypeScript compiler contract and dist emission; validated publish artifact contents via `npm pack --dry-run` (using temporary npm cache path due local cache permission issue).

## Commit Log
- 2026-02-17: `4902835` - Build Phase 1 core types and normalizer.
- 2026-02-17: `7645082` - Implement Phase 2 wallet + Blockfrost adapters and table-driven mapping tests.
- 2026-02-17: `1778390` - Update progress log after Phase 2 commit.
- 2026-02-17: `c475253` - Add node string heuristic adapter and fixture-backed tests.
- 2026-02-17: `b408847` - Add GitHub Actions CI workflow for npm test.
- 2026-02-17: `970a4f5` - Prepare package publish metadata for public ESM release.
- 2026-02-17: `8df3a17` - Add project `.gitignore` and update progress log.
- 2026-02-17: `ee53fca` - Add `CHANGELOG.md` entry for taxonomy v1 and sync progress.

## Next
- [ ] Read `mvp.md` and this file at start of the next cycle.
- [x] Add a repository CI workflow (`.github/workflows`) to enforce `npm test` on push/PR.
- [x] Finalize package publish readiness blockers from Human Task 3 (`package` scope/name, TS build/types contract, doc path cleanup).
- [x] Add `CHANGELOG.md` entry for taxonomy v1 and known limitations.
- [ ] Run real-time integration testing against Mesh + Blockfrost + Eternl stack.
- [ ] Push repository to GitHub remote and verify Actions CI run on latest commit.
- [x] Add regression fixtures/tests for any newly observed real-world errors.
- [x] Add `npm run typecheck` (no special hacks) and confirm pass.
- [x] Re-run publish gate checklist (`npm pack`, `npm test`, `npm run typecheck`) before publish.

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
- Status: `Pending`
- Expected artifact:
  - `gitRemoteUrl`: e.g. `git@github.com:<owner>/cardano-error-normalizer.git` or `https://github.com/<owner>/cardano-error-normalizer.git`
  - push target branch confirmation (`main`)
- Needed by agent to configure `origin`, push commits, and verify CI trigger links.

Task 4 (agent, after human Task 4):
- Configure `origin` remote, push `main`, and confirm GitHub Actions CI is triggered for the latest commit.
- Status: `Pending`
- Completion gate:
  - `git remote -v` shows `origin`.
  - `git push -u origin main` succeeds.
  - CI run URL captured in this file.
