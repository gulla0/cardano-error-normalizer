# Verification and Gap-Fill for cardano-error-normalizer MVP Tables and Heuristics

## Sources and methodology

This review cross-checks your MVP tables/heuristics against primary specifications and primary vendor documentation, then supplements with real-world payloads captured in public issue reports and support articles. The core standards source is the CIP site published by the entity["organization","Cardano Foundation","cip program"]. citeturn19search0turn9view0turn10view0

For wallet errors and method signatures, the authoritative references are CIP-30’s “Error Types” and its “Full API” method signatures (including `getUtxos`, `signTx`, `signData`, `submitTx`) and CIP-95’s extension details, notably the additional `DeprecatedCertificate` TxSignError code. citeturn15view0turn9view2turn9view3turn9view4turn10view0turn10view1

For provider errors, the authoritative reference is entity["company","Blockfrost","cardano api service"]’s OpenAPI specification and official docs regarding HTTP status semantics and their canonical error payload schema (`status_code`, `error`, `message`). citeturn2view0turn20view1turn4search2

For Mesh integration surfaces (method names/signatures used to build presets), the references are entity["organization","MeshJS","typescript cardano sdk"] documentation showing the common provider interfaces (notably `fetchAddressUTxOs`, `fetchProtocolParameters`, `submitTx`) and wallet APIs (`getUtxos`, `signTx`, `submitTx`). citeturn8view0turn8view1turn8view2

For node/ledger error-string heuristics, the validation is grounded in (a) official troubleshooting articles from entity["organization","Input Output","iog former iohk"]’s support knowledge base for `BadInputsUTxO` and `ValueNotConservedUTxO`, and (b) additional community-captured examples for other ledger error tags such as `OutputTooSmallUTxO`, `BabbageOutputTooSmallUTxO`, and script evaluation failures (`ValidationTagMismatch`, `PlutusFailure`, “budget was overspent”). citeturn5search24turn5search25turn6search5turn5search6turn6search13turn6search1

For Eternl-specific deviations, the primary check is vendor documentation stating CIP-30 API adherence across connection types. citeturn11search4

## Corrections report

### Wallet error families and codes (CIP-30 and CIP-95)

**✅ Confirmed (no change):**  
CIP-30 defines `APIError` codes `-1..-4` with meanings (InvalidRequest, InternalError, Refused, AccountChange), and defines `TxSignError` (ProofGeneration=1, UserDeclined=2) and `TxSendError` (Refused=1, Failure=2). citeturn18search0turn9view2turn9view3

**✏️ Corrections (old → new):**  
Your partial Wallet Mapping Table is missing two CIP-30 error families that are explicitly specified and should be represented in your “wallet adapter” mapping:
- Add `DataSignError` with codes (ProofGeneration=1, AddressNotPK=2, UserDeclined=3). citeturn9view4turn9view1  
- Add `PaginateError` (structure `{ maxSize: number }`) and note it is thrown by `getUtxos` when pagination bounds are invalid. citeturn9view3turn15view0

**⚠️ Uncertain (and why):**  
Mapping CIP-95’s `TxSignError.DeprecatedCertificate (3)` directly to your internal `TX_LEDGER_VALIDATION_FAILED` is not mandated by the spec—CIP-95 defines the condition (deprecated certificates) but not any downstream classification taxonomy. This means your chosen internal code is a product decision (reasonable, but not spec-derived). citeturn10view0turn10view1

### CIP-95 extensions

**✅ Confirmed (no change):**  
CIP-95 extends CIP-30 error semantics and adds `TxSignErrorCode.DeprecatedCertificate: 3`, returned when the tx contains a deprecated certificate (regardless of user consent). citeturn10view0turn10view1

**✏️ Corrections (old → new):**  
Your baseline row “TxSignError (CIP-95 ext) code 3 DeprecatedCertificate” is correct as a statement of CIP-95. The correction is to document the precise condition: CIP-95 explicitly calls out certificate types deprecated in the Conway era and ties them to this error code. citeturn10view1

### Blockfrost HTTP status semantics and payload shape

**✅ Confirmed (no change):**  
The meaning table for 400/402/403/404/418/425/429/500 is aligned with Blockfrost’s published docs:  
- 402 = daily request limit exceeded; 429 = rate-limited; 418 = auto-banned after flooding (after 402 or 429); 425 = Cardano mempool full; 500 = backend/server issue. citeturn2view0turn4search2turn1search2  
Blockfrost’s canonical error payload uses the fields `status_code`, `error`, `message`. citeturn2view0turn20view1

**✏️ Corrections (old → new):**  
One operational nuance to add: Blockfrost has changed/standardized the ordering of fields in the error JSON (order changes are documented in the OpenAPI changelog). Your heuristics must not depend on property order; only on key presence. citeturn1search19turn2view0

**⚠️ Uncertain (and why):**  
Your “other 4xx → BAD_REQUEST” fallback is generally fine for MVP, but in practice, 4xx includes cases like “network mismatch” or “endpoint allowlist/origin allowlist” returning 403 that are more actionable when preserved as `UNAUTHORIZED`/`FORBIDDEN`. This is not a spec contradiction—just a DX/observability tradeoff in classification. citeturn4search2turn4search12

### MeshJS integration surface (for presets)

**✅ Confirmed (no change):**  
Mesh providers implement a consistent interface, including (at minimum) `fetchAddressUTxOs(address, asset?)`, `fetchProtocolParameters(epoch?)`, and `submitTx(tx)`. citeturn8view0turn8view2  
Mesh wallet APIs commonly used by dApps include `getUtxos()`, `signTx(unsignedTx, partialSign)`, `submitTx(signedTx)`. citeturn8view1

**✏️ Corrections (old → new):**  
If your current preset example is matching on `getUtxos`, note the spec name differs depending on layer:
- CIP-30 wallet method is `getUtxos(...)` (lowercase “t” in “Utxos” in the CIP text) and includes `PaginateError`. citeturn15view0  
- Mesh provider method is `fetchAddressUTxOs(...)`, not `getUtxos`. citeturn8view0  
So presets should either (a) target the Mesh provider interface, or (b) target CIP-30 wallet API; mixing names will confuse users and reduce preset hit rate.

### Eternl deviations

**✅ Confirmed (no change):**  
Eternl documentation states that all supported connection types adhere to the CIP-30 API. citeturn11search4

**⚠️ Uncertain (and why):**  
I did not find strong, direct evidence of Eternl-specific *error shape* deviations beyond CIP-30/CIP-95 (e.g., additional fields on error objects). Given that, the safest documented posture is: treat Eternl as CIP-30/CIP-95 compliant; use `walletHint` only for UI/analytics copy. citeturn11search4turn15view0turn10view0

### Node/ledger error-string heuristics

**✅ Confirmed (no change):**  
Your mappings for the following tags match how they are described/diagnosed in official troubleshooting references and common usage:
- `BadInputsUTxO` corresponds to invalid/missing UTxO input references (often wrong index or already spent). citeturn5search24turn5search20  
- `ValueNotConservedUTxO` corresponds to an unbalanced transaction (inputs not equal to outputs + fees + change). citeturn5search25turn5search1  
- `OutputTooSmallUTxO` / `BabbageOutputTooSmallUTxO` correspond to the minimum UTxO (min ADA) requirement being violated. citeturn6search5turn5search6turn5search2  
- Script validation failures commonly surface within `ShelleyTxValidationError / ApplyTxError ... (ValidationTagMismatch ... PlutusFailure ...)` with messages such as “budget was overspent.” citeturn6search13turn6search1

**⚠️ Uncertain (and why):**  
A broad regex like `/expected word/i` may catch multiple CBOR/decoder paths (tx CBOR, handshake codec mismatch, etc.). It’s still reasonable to map to a “deserialise/decode failure” bucket, but the resolution guidance should avoid over-specific advice (“tx CBOR malformed”) unless you can confirm it’s a tx-body decode path (vs handshake mismatch). citeturn5search7turn5search19

## Wallet mapping table for CIP-30 and CIP-95

The table below is “spec-truthful” for numeric codes/meanings, and gives recommended internal mappings and confidence. “Confidence” refers to the spec part; your internal code choices are inherently product decisions.

| Error family | Code / fields | Spec meaning | Recommended `CardanoErrorCode` | Confidence | Notes |
|---|---:|---|---|---|---|
| APIError (CIP-30) | -1 | InvalidRequest | `WALLET_INVALID_REQUEST` | High | Error object is `{ code, info }`. citeturn18search0 |
| APIError (CIP-30) | -2 | InternalError | `WALLET_INTERNAL` | High | — citeturn18search0 |
| APIError (CIP-30) | -3 | Refused (disconnect / no access) | `WALLET_REFUSED` | High | — citeturn18search0 |
| APIError (CIP-30) | -4 | AccountChange | `WALLET_ACCOUNT_CHANGED` | High | Spec says dApp should re-`enable()`. citeturn18search0 |
| TxSignError (CIP-30) | 1 | ProofGeneration | `WALLET_SIGN_PROOF_GENERATION` | High | Returned when user accepted but wallet can’t fully sign. citeturn9view2turn9view1 |
| TxSignError (CIP-30) | 2 | UserDeclined | `WALLET_SIGN_USER_DECLINED` | High | — citeturn9view2turn9view1 |
| TxSignError (CIP-95) | 3 | DeprecatedCertificate | `TX_LEDGER_VALIDATION_FAILED` (or a dedicated “deprecated certificate” code if you add one) | High (spec) / Medium (mapping) | Spec condition is well-defined; internal code is your taxonomy decision. citeturn10view0turn10view1 |
| TxSendError (CIP-30) | 1 | Refused (wallet won’t send; could be rate limiting) | `WALLET_SUBMIT_REFUSED` | High | — citeturn9view3 |
| TxSendError (CIP-30) | 2 | Failure (wallet couldn’t send) | `WALLET_SUBMIT_FAILURE` | High | — citeturn9view3 |
| DataSignError (CIP-30) | 1 | ProofGeneration | **Preferred:** `WALLET_DATA_SIGN_PROOF_GENERATION` | High | If you refuse new codes for MVP, fallback to `WALLET_INTERNAL` or share `WALLET_SIGN_PROOF_GENERATION` (less precise). citeturn9view4turn9view1 |
| DataSignError (CIP-30) | 2 | AddressNotPK | **Preferred:** `WALLET_DATA_SIGN_ADDRESS_NOT_PK` | High | Often actionable: “use base/enterprise/pointer address with payment key,” per CIP-30. citeturn9view4turn9view1 |
| DataSignError (CIP-30) | 3 | UserDeclined | **Preferred:** `WALLET_DATA_SIGN_USER_DECLINED` | High | — citeturn9view4turn9view1 |
| PaginateError (CIP-30) | `{ maxSize }` | Pagination request out of bounds | **Preferred:** `WALLET_PAGINATION_OUT_OF_RANGE` | High | Thrown by `getUtxos` when pagination exceeds boundaries. citeturn9view3turn15view0 |

## Blockfrost status mapping table and payload shape

Blockfrost documents these statuses and the canonical error payload schema. The payload schema is stable in keys (`status_code`, `error`, `message`) even if field ordering has changed over time. citeturn2view0turn20view1turn1search19

| HTTP status | Blockfrost meaning | Canonical payload keys | Recommended `CardanoErrorCode` | Confidence | Notes (`meta` suggestions) |
|---:|---|---|---|---|---|
| 400 | Request not valid | `status_code`, `error`, `message` | `BAD_REQUEST` | High | Example message: “Backend did not understand your request.” citeturn20view1turn2view0 |
| 402 | Project exceeds daily request limit | same | `QUOTA_EXCEEDED` | High | Treat as quota; add `meta.blockfrostReason="daily_limit_or_over_limit"`; real payloads show `{ error:"Project Over Limit", message:"Usage is over limit.", status_code:402 }`. citeturn2view0turn4search5 |
| 403 | Not authenticated / invalid project token | same | `UNAUTHORIZED` | High | OpenAPI example: “Invalid project token.” citeturn2view0 |
| 404 | Resource not found | same | `NOT_FOUND` | High | Useful for “wrong network / wrong address type” cases. citeturn2view0turn4search2 |
| 418 | Auto-banned after flooding (after 402/429) | same | `FORBIDDEN` | High | Add `meta.blockfrostReason="auto_banned"`; OpenAPI defines 418 as auto-banned for flooding. citeturn2view0turn4search2 |
| 425 | Cardano mempool full (tx submit) | same | `MEMPOOL_FULL` | High | Add `meta.blockfrostReason="mempool_full"`; OpenAPI example suggests retry later. citeturn2view0turn4search2 |
| 429 | Rate limited | same | `RATE_LIMITED` | High | Add `meta.blockfrostReason="rate_limited"`; note 418 may follow persistent 402/429. citeturn2view0turn4search2 |
| 5xx | Server-side problem | same | `PROVIDER_INTERNAL` | High | Suggest retry with backoff; keep raw payload. citeturn2view0turn4search2 |

## MeshJS integration surface for presets

This section focuses on “what method names are stable enough to justify presets,” and what default `{ stage, source }` mapping is reasonable.

### Provider-side (Mesh IFetcher / ISubmitter)

The Mesh custom-provider guide explicitly enumerates the interface and shows `submitTx(tx: string): Promise<string>` and fetch methods such as `fetchAddressUTxOs` and `fetchProtocolParameters`. citeturn8view0turn8view2

| Method name | High-level signature | Default `{ stage, source }` | Confidence | Rationale |
|---|---|---|---|---|
| `fetchAddressUTxOs` | `(address, asset?) → Promise<UTxO[]>` | `{ stage:"build", source:"provider_query" }` | High | Used during tx building to select inputs. citeturn8view0turn8view2 |
| `fetchProtocolParameters` | `(epoch?) → Promise<Protocol>` | `{ stage:"build", source:"provider_query" }` | High | Used during tx building/fee calculation. citeturn8view0turn8view2 |
| `fetchAccountInfo` | `(address) → Promise<AccountInfo>` | `{ stage:"build", source:"provider_query" }` | High | Query surface. citeturn8view0 |
| `submitTx` | `(tx: string) → Promise<string>` | `{ stage:"submit", source:"provider_submit" }` | High | Canonical provider submission method. citeturn8view0turn8view2 |

### Wallet-side (CIP-30 and Mesh wallet wrappers)

CIP-30 defines the wallet API methods and their error types; notably, `getUtxos` can throw `PaginateError`, `signTx` can throw `TxSignError`, `signData` can throw `DataSignError`, and `submitTx` can throw `TxSendError`. citeturn15view0turn9view1turn9view2turn9view3turn9view4  
Mesh wallet docs show common operations including `getUtxos`, `signTx`, `submitTx`. citeturn8view1

| Method name | High-level signature | Default `{ stage, source }` | Confidence | Rationale |
|---|---|---|---|---|
| `getUtxos` | `(amount?, paginate?) → Promise<…>` | `{ stage:"build", source:"wallet_query" }` (or `provider_query` if you collapse) | High (method) / Medium (source label) | CIP-30 defines `getUtxos` and ties it to building flows. citeturn15view0turn8view1 |
| `signTx` | `(tx, partialSign?) → Promise<witness_set>` | `{ stage:"sign", source:"wallet_sign" }` | High | CIP-30 defines signing, with `TxSignError`. citeturn9view2turn8view1 |
| `signData` | `(addr, payload) → Promise<DataSignature>` | `{ stage:"sign", source:"wallet_sign" }` | High | CIP-30 defines message signing, with `DataSignError`. citeturn9view1turn9view4 |
| `submitTx` | `(tx) → Promise<hash32>` | `{ stage:"submit", source:"wallet_submit" }` (or reuse `provider_submit` in MVP) | High (method) / Medium (source label) | CIP-30 defines wallet submission and `TxSendError`. citeturn9view3turn8view1 |

## Fixture pack and version and assumption notes

### What these fixtures are derived from

Blockfrost fixtures are based on Blockfrost’s OpenAPI schema examples for 400/403/404/418/425/429/500, plus a real 402 payload captured in an entity["organization","Intersect","intersect mbo"] issue that includes `{ error:"Project Over Limit", message:"Usage is over limit.", status_code:402 }`. citeturn2view0turn20view1turn4search5

Wallet/CIP fixtures are derived from CIP-30/CIP-95 definitions; additionally, a real-world CIP-30-style APIError object (code -1) embedded in a Mesh BrowserWallet error string is captured in a public issue. citeturn18search0turn10view0turn17view0

Mesh/provider-thrown fixtures are derived from public Mesh issues that show the shape of thrown/rejected objects containing HTTP-like fields and nested ledger errors. citeturn13view1turn17view0

Node-string fixtures are grounded in official troubleshooting articles (`BadInputsUTxO`, `ValueNotConservedUTxO`) and representative public examples for decode failures, min-UTxO violations, and Plutus/script evaluation failures. citeturn5search24turn5search25turn5search7turn6search5turn6search13turn5search6

### JSON fixture pack

```json
{
  "blockfrost": [
    {
      "id": "bf_400_bad_request_schema_example",
      "raw": { "status_code": 400, "error": "Bad Request", "message": "Backend did not understand your request." },
      "expectedMeta": { "httpStatus": 400, "inferredProvider": "blockfrost", "inferredKind": "http_error" },
      "expectedCardanoErrorCode": "BAD_REQUEST"
    },
    {
      "id": "bf_403_invalid_project_token_schema_example",
      "raw": { "status_code": 403, "error": "Forbidden", "message": "Invalid project token." },
      "expectedMeta": { "httpStatus": 403, "inferredProvider": "blockfrost", "inferredKind": "http_error" },
      "expectedCardanoErrorCode": "UNAUTHORIZED"
    },
    {
      "id": "bf_402_over_limit_real_payload",
      "raw": { "status_code": 402, "error": "Project Over Limit", "message": "Usage is over limit." },
      "expectedMeta": {
        "httpStatus": 402,
        "inferredProvider": "blockfrost",
        "inferredKind": "http_error",
        "blockfrostReason": "daily_limit_or_over_limit"
      },
      "expectedCardanoErrorCode": "QUOTA_EXCEEDED"
    },
    {
      "id": "bf_418_auto_banned_schema_example",
      "raw": { "status_code": 418, "error": "Requested Banned", "message": "IP has been auto-banned for flooding." },
      "expectedMeta": { "httpStatus": 418, "inferredProvider": "blockfrost", "inferredKind": "http_error", "blockfrostReason": "auto_banned" },
      "expectedCardanoErrorCode": "FORBIDDEN"
    },
    {
      "id": "bf_425_mempool_full_schema_example",
      "raw": { "status_code": 425, "error": "Mempool Full", "message": "Mempool is full, please try resubmitting again later." },
      "expectedMeta": { "httpStatus": 425, "inferredProvider": "blockfrost", "inferredKind": "http_error", "blockfrostReason": "mempool_full" },
      "expectedCardanoErrorCode": "MEMPOOL_FULL"
    },
    {
      "id": "bf_429_rate_limited_schema_example",
      "raw": { "status_code": 429, "error": "Project Over Limit", "message": "Usage is over limit." },
      "expectedMeta": { "httpStatus": 429, "inferredProvider": "blockfrost", "inferredKind": "http_error", "blockfrostReason": "rate_limited" },
      "expectedCardanoErrorCode": "RATE_LIMITED"
    },
    {
      "id": "bf_500_internal_schema_example",
      "raw": { "status_code": 500, "error": "Internal Server Error", "message": "An unexpected response was received from the backend." },
      "expectedMeta": { "httpStatus": 500, "inferredProvider": "blockfrost", "inferredKind": "http_error" },
      "expectedCardanoErrorCode": "PROVIDER_INTERNAL"
    }
  ],
  "wallet_cip30_cip95": [
    {
      "id": "cip30_apierror_invalid_request",
      "raw": { "code": -1, "info": "Inputs do not conform to this spec or are otherwise invalid." },
      "expectedMeta": { "inferredKind": "cip30_error" },
      "expectedCardanoErrorCode": "WALLET_INVALID_REQUEST"
    },
    {
      "id": "cip30_txsign_user_declined_template",
      "raw": { "code": 2, "info": "User declined to sign the transaction." },
      "expectedMeta": { "inferredKind": "cip30_error" },
      "expectedCardanoErrorCode": "WALLET_SIGN_USER_DECLINED"
    },
    {
      "id": "cip30_txsend_refused_template",
      "raw": { "code": 1, "info": "Wallet refused to send the tx (e.g. rate limiting)." },
      "expectedMeta": { "inferredKind": "cip30_error" },
      "expectedCardanoErrorCode": "WALLET_SUBMIT_REFUSED"
    },
    {
      "id": "cip30_datasign_address_not_pk_template",
      "raw": { "code": 2, "info": "Address was not a P2PK address and thus had no SK associated with it." },
      "expectedMeta": { "inferredKind": "cip30_error" },
      "expectedCardanoErrorCode": "WALLET_DATA_SIGN_ADDRESS_NOT_PK"
    },
    {
      "id": "cip30_paginate_error_template",
      "raw": { "maxSize": 100 },
      "expectedMeta": { "inferredKind": "cip30_error" },
      "expectedCardanoErrorCode": "WALLET_PAGINATION_OUT_OF_RANGE"
    },
    {
      "id": "cip95_txsign_deprecated_certificate_template",
      "raw": { "code": 3, "info": "Transaction contains a deprecated certificate." },
      "expectedMeta": { "inferredKind": "cip95_error" },
      "expectedCardanoErrorCode": "TX_LEDGER_VALIDATION_FAILED"
    }
  ],
  "mesh_provider_thrown": [
    {
      "id": "mesh_browserwallet_signTx_embeds_cip30_apierror",
      "raw": {
        "message": "[BrowserWallet] An error occurred during signTx: {\"code\":-1,\"info\":\"Inputs do not conform to this spec or are otherwise invalid.\"}."
      },
      "expectedMeta": { "inferredKind": "mesh_wrapped", "meshWrapped": true },
      "expectedCardanoErrorCode": "WALLET_INVALID_REQUEST"
    },
    {
      "id": "mesh_blockfrost_submit_error_http400_embedded_ledger_text",
      "raw": {
        "data": {
          "status_code": 400,
          "error": "Bad Request",
          "message": "{\"contents\":{\"contents\":{\"contents\":{\"era\":\"ShelleyBasedEraConway\",\"error\":[\"ConwayUtxowFailure (MissingVKeyWitnessesUTXOW (...))\"],\"kind\":\"ShelleyTxValidationError\"},\"tag\":\"TxValidationErrorInCardanoMode\"},\"tag\":\"TxCmdTxSubmitValidationError\"},\"tag\":\"TxSubmitFail\"}"
        },
        "status": 400
      },
      "expectedMeta": { "httpStatus": 400, "inferredProvider": "blockfrost", "inferredKind": "http_error", "meshWrapped": true },
      "expectedCardanoErrorCode": "BAD_REQUEST"
    }
  ],
  "node_string_errors": [
    {
      "id": "node_deserialisefailure_handshake_unexpected_key",
      "raw": "cardano-cli: DecoderFailure (Handshake) ... (DeserialiseFailure 2 \"codecHandshake.Confirm: unexpected key\")",
      "expectedCardanoErrorCode": "TX_DESERIALISE_FAILURE"
    },
    {
      "id": "node_deserialisefailure_expected_list_len",
      "raw": "transaction read error RawCborDecodeError [DecoderErrorDeserialiseFailure \"Byron Tx\" (DeserialiseFailure 0 \"expected list len\")...]",
      "expectedCardanoErrorCode": "TX_DESERIALISE_FAILURE"
    },
    {
      "id": "ledger_badinputsutxo_applytxerror_example",
      "raw": "ApplyTxError [LedgerFailure (UtxowFailure (UtxoFailure (BadInputsUTxO ...)))]",
      "expectedCardanoErrorCode": "TX_INPUTS_MISSING_OR_SPENT"
    },
    {
      "id": "ledger_valuenotconservedutxo_diagnostic_example",
      "raw": "ApplyTxError ... (ValueNotConservedUTxO ...)",
      "expectedCardanoErrorCode": "TX_VALUE_NOT_CONSERVED"
    },
    {
      "id": "ledger_outputtoosmallutxo_example",
      "raw": "ShelleyTxValidationError ... (OutputTooSmallUTxO ...)",
      "expectedCardanoErrorCode": "TX_OUTPUT_TOO_SMALL"
    },
    {
      "id": "ledger_babbage_output_too_small_example",
      "raw": "BabbageOutputTooSmallUTxO",
      "expectedCardanoErrorCode": "TX_OUTPUT_TOO_SMALL"
    },
    {
      "id": "ledger_plutus_validationtagmismatch_plutusfailure_budget_overspent",
      "raw": "ShelleyTxValidationError ... (ValidationTagMismatch ... (PlutusFailure \"... CekError ... The budget was overspent ...\"))",
      "expectedCardanoErrorCode": "TX_SCRIPT_EVALUATION_FAILED"
    },
    {
      "id": "ledger_shelleytxvalidationerror_fallback",
      "raw": "ShelleyTxValidationError ... (ApplyTxError [...])",
      "expectedCardanoErrorCode": "TX_LEDGER_VALIDATION_FAILED"
    }
  ]
}
```

### Version and assumption notes

This research assumes “current” primary sources as of 2026-02-18 (America/Detroit). For Mesh, method-name assumptions are anchored to the published Mesh docs for providers (IFetcher/ISubmitter and `submitTx`) and wallets (`getUtxos`, `signTx`, `submitTx`), which are stable enough to justify presets. citeturn8view0turn8view1turn8view2

For Blockfrost, the canonical error object shape is anchored to the vendor OpenAPI examples and docs, but the OpenAPI changelog indicates past changes to field ordering—so error parsing must be key-based rather than order-based. citeturn2view0turn20view1turn1search19

For Eternl, no wallet-specific error-shape deviations were confirmed; vendor docs claim CIP-30 adherence, so treat it as standard CIP-30/CIP-95 unless you have captured counterexamples in production telemetry. citeturn11search4turn10view0turn15view0