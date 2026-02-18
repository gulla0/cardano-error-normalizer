# Verification Follow-Up Instructions (Spec-Aligned + Fixture-Tested)

## Source of truth
- Verification report: `Research Dump/verification-3rdParty-errors.md`
- This file translates report findings into implementation-ready tasks.

## Mandatory corrections from verification report
- Add missing CIP-30 families:
  - `DataSignError` (codes `1`, `2`, `3`)
  - `PaginateError` shape with `{ maxSize }`
- Keep CIP-95 `TxSignError` mapping spec-true:
  - `code 3 = DeprecatedCertificate`
  - Internal taxonomy mapping remains a product decision.
- Keep method naming layer-correct:
  - Mesh provider preset: `fetchAddressUTxOs` (not CIP-30 `getUtxos`)
- Blockfrost parsing must be key-based:
  - Never rely on JSON property order.

## DX improvement plan (exact spec targets)

### 0) API shape normalization (config vs context)
- Normalize provenance/environment under `NormalizeContext`.
- Normalize behavior flags under `NormalizeConfig`.
- Required signatures:
  - `normalizeError(raw: unknown, ctx?: Partial<NormalizeContext>, config?: NormalizeConfig): CardanoAppError`
  - `createNormalizer(options?: { config?: NormalizeConfig; defaults?: Partial<NormalizeContext> })`
- `createNormalizer` return contract:
  - `normalize(raw, overrideCtx?)`
  - `withDefaults(moreDefaults)`

### 1) React DX update (`./react` only)
- `package.json`:
  - Add `peerDependencies.react >=16.8.0`
  - Ensure `exports["./react"]` resolves JS + types:
    - `dist/react/index.js`
    - `dist/react/index.d.ts`
- Hook API:
  - `useCardanoError<T>(options?: { operation?; defaults?; config? })`
  - Return: `{ loading, data, error, run, normalize, reset }`
  - `normalize(raw, overrideCtx)` merges context as `{ ...defaults, ...overrideCtx }`
  - `run` catches, normalizes, stores error, and rethrows normalized error
- README:
  - Remove `bindings` flow
  - Document non-React peer warning behavior

### 2) Scoped defaults factory (no globals)
- `createNormalizer({ defaults, config })` should:
  - Merge runtime context as `{ ...defaults, ...overrideCtx }`
  - Keep config immutable per normalizer instance
  - Support `withDefaults(more)` returning a new merged instance

### 3) Presets with clear layer separation
- Add `src/presets/meshProvider.ts`:
  - `submitTx` -> `{ stage: "submit", source: "provider_submit" }`
  - `fetchAddressUTxOs`, `fetchProtocolParameters`, `fetchAccountInfo` -> `{ stage: "build", source: "provider_query" }`
- Add `src/presets/cip30Wallet.ts`:
  - `getUtxos` -> `{ stage: "build", source: "wallet_query" }`
  - `signTx`, `signData` -> `{ stage: "sign", source: "wallet_sign" }`
  - `submitTx` -> `{ stage: "submit", source: "wallet_submit" }` (or intentional collapse choice)
- Export both presets from root package.

### 4) Heuristics: enrich `meta` only
- Add/extend `src/core/analyzers.ts` with:
  - `meta.inferredProvider`
  - `meta.inferredKind`
  - `meta.httpStatus`
  - `meta.blockfrostReason`
- Blockfrost detection by keys (`status_code`) across known nesting shapes.
- Wallet detection for CIP numeric `{ code, info }` objects.
- Node detection for ledger-pattern strings.
- Merge rule in `normalizeError`:
  - `meta: { ...core.meta, ...heur }`
  - Do not overwrite explicit provenance (`ctx.source`, `ctx.stage`) from caller.

### 5) Taxonomy additions (required)
- Add internal codes:
  - `WALLET_DATA_SIGN_PROOF_GENERATION`
  - `WALLET_DATA_SIGN_ADDRESS_NOT_PK`
  - `WALLET_DATA_SIGN_USER_DECLINED`
  - `WALLET_PAGINATION_OUT_OF_RANGE`
- CIP-95 deprecated certificate handling:
  - Keep spec interpretation for `code===3`
  - If mapped specially, set `meta.cip95DeprecatedCertificate=true`
- Update wallet adapter for:
  - DataSign mapping
  - Paginate detection (`maxSize` numeric)

### 6) Fixtures and tests (required)
- Add fixture sets:
  - `fixtures/blockfrost` (`402`, `418`, `425`, `429`, `400`, `500`)
  - `fixtures/wallet` (`APIError`, `TxSignError`, `TxSendError`, `DataSignError`, `PaginateError`, CIP-95 code `3`)
  - `fixtures/nodeStrings`
  - `fixtures/mesh`
- Test assertions:
  - `inferErrorMeta` inference fields per fixture
  - wallet adapter new DataSign/Paginate codes
  - Blockfrost key-based parsing and shuffled-key resilience
  - node string fixtures map to expected `CardanoErrorCode` buckets conservatively

### 7) Documentation updates
- README mapping table:
  - Add DataSignError + PaginateError rows
  - Add Blockfrost key-based parsing note
- README examples:
  - Mesh preset uses `fetchAddressUTxOs`
  - CIP-30 preset uses `getUtxos`

## Execution checklist (minimal)
1. React hook DX (`peerDependencies`, exports, bindingless API)
2. Scoped defaults (`createNormalizer` + `withDefaults`)
3. Presets (`meshProviderPreset`, `cip30WalletPreset`)
4. Meta inference enrichment (`inferErrorMeta` + merge discipline)
5. Taxonomy + adapter updates (DataSign/Paginate/CIP-95 metadata)
6. Fixture-driven tests and regression locking
7. README alignment
