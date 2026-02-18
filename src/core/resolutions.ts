import type { CardanoErrorCode } from "../codes.ts";
import type { ErrorResolution } from "../types.ts";

const RESOLUTIONS_BY_CODE: Readonly<Partial<Record<CardanoErrorCode, ErrorResolution>>> = {
  UNKNOWN: {
    title: "Inspect error details",
    steps: [
      "Log the full normalized error payload",
      "Capture provider/wallet context and retry with diagnostics enabled"
    ]
  },
  UNEXPECTED_SHAPE: {
    title: "Validate incoming error shape",
    steps: [
      "Log the original payload and adapter metadata",
      "Update parsing guards for the observed provider or wallet response"
    ]
  },
  NETWORK_UNREACHABLE: {
    title: "Check network connectivity",
    steps: [
      "Verify internet and provider endpoint reachability",
      "Retry request with exponential backoff"
    ]
  },
  TIMEOUT: {
    title: "Retry timed-out request",
    steps: [
      "Retry the operation with a longer timeout window",
      "If repeated, reduce payload size or split operations"
    ]
  },
  RATE_LIMITED: {
    title: "Back off and retry",
    steps: [
      "Wait for rate limit reset before retrying",
      "Reduce request burst size and add backoff"
    ]
  },
  QUOTA_EXCEEDED: {
    title: "Increase or reset provider quota",
    steps: [
      "Check current Blockfrost project usage",
      "Switch project key or upgrade quota plan",
      "Retry once quota has reset"
    ],
    docsUrl: "https://blockfrost.dev/start-building/errors"
  },
  UNAUTHORIZED: {
    title: "Verify API credentials",
    steps: [
      "Confirm project/API key is present and valid",
      "Ensure the key matches the selected network"
    ]
  },
  FORBIDDEN: {
    title: "Resolve provider access restrictions",
    steps: [
      "Confirm API key permissions and account status",
      "If auto-banned, pause traffic and retry later"
    ]
  },
  NOT_FOUND: {
    title: "Verify resource identifiers",
    steps: [
      "Check tx hash, address, or endpoint path for typos",
      "Confirm resource exists on the selected network"
    ]
  },
  BAD_REQUEST: {
    title: "Fix request payload",
    steps: [
      "Validate request parameters against provider schema",
      "Rebuild request with strict typing and retry"
    ]
  },
  PROVIDER_INTERNAL: {
    title: "Retry after provider error",
    steps: [
      "Retry request with backoff",
      "Fail over to an alternate provider if available"
    ]
  },
  MEMPOOL_FULL: {
    title: "Resubmit when mempool clears",
    steps: [
      "Wait for lower network congestion",
      "Retry submission with adjusted fee strategy"
    ]
  },
  WALLET_INVALID_REQUEST: {
    title: "Correct wallet API input",
    steps: [
      "Validate wallet method arguments and CBOR format",
      "Retry with a freshly built transaction payload"
    ]
  },
  WALLET_INTERNAL: {
    title: "Recover from wallet internal failure",
    steps: [
      "Reconnect wallet extension and refresh app state",
      "Retry operation and inspect wallet logs if repeated"
    ]
  },
  WALLET_REFUSED: {
    title: "Handle wallet refusal",
    steps: [
      "Prompt user to reconnect or re-enable wallet permissions",
      "Retry operation after wallet confirmation"
    ]
  },
  WALLET_ACCOUNT_CHANGED: {
    title: "Sync with active wallet account",
    steps: [
      "Reload dApp state with the newly selected account",
      "Rebuild and retry the pending operation"
    ]
  },
  WALLET_SIGN_USER_DECLINED: {
    title: "Ask user to re-approve signing",
    steps: [
      "Explain why signature is required",
      "Prompt signing again when user is ready"
    ]
  },
  WALLET_SIGN_PROOF_GENERATION: {
    title: "Rebuild transaction before signing",
    steps: [
      "Ensure transaction body and witness requirements are valid",
      "Retry signing with latest wallet/session state"
    ]
  },
  WALLET_DATA_SIGN_PROOF_GENERATION: {
    title: "Retry data signing with a supported payload",
    steps: [
      "Confirm payload encoding and address format are valid",
      "Retry signData after refreshing wallet/session state"
    ]
  },
  WALLET_DATA_SIGN_ADDRESS_NOT_PK: {
    title: "Use a payment-key address for signData",
    steps: [
      "Call signData with a base, enterprise, or pointer address",
      "Avoid reward/script addresses that do not expose a payment key"
    ]
  },
  WALLET_DATA_SIGN_USER_DECLINED: {
    title: "Ask user to re-approve data signing",
    steps: [
      "Explain why the message signature is needed",
      "Prompt signData again when the user is ready"
    ]
  },
  WALLET_PAGINATION_OUT_OF_RANGE: {
    title: "Adjust wallet pagination bounds",
    steps: [
      "Request fewer pages or use a lower page index",
      "Respect the wallet-provided maxSize limit"
    ]
  },
  WALLET_SUBMIT_REFUSED: {
    title: "Resolve submit refusal",
    steps: [
      "Re-check wallet permissions and active account",
      "Retry submit after reconnecting wallet"
    ]
  },
  WALLET_SUBMIT_FAILURE: {
    title: "Retry wallet submission",
    steps: [
      "Retry submit with fresh wallet connection",
      "Fallback to provider submit path if available"
    ]
  },
  TX_DESERIALISE_FAILURE: {
    title: "Rebuild transaction encoding",
    steps: [
      "Recreate transaction CBOR with the correct schema",
      "Validate serialization before submit"
    ]
  },
  TX_INPUTS_MISSING_OR_SPENT: {
    title: "Refresh UTxOs and rebuild tx",
    steps: [
      "Refetch wallet UTxO set",
      "Rebuild transaction with currently spendable inputs"
    ]
  },
  TX_OUTPUT_TOO_SMALL: {
    title: "Increase output lovelace",
    steps: [
      "Raise each affected output to protocol minimum",
      "Recalculate fees and rebuild transaction"
    ]
  },
  TX_VALUE_NOT_CONSERVED: {
    title: "Rebalance transaction values",
    steps: [
      "Recompute inputs/outputs including fees and change",
      "Ensure multi-asset totals are conserved"
    ]
  },
  TX_LEDGER_VALIDATION_FAILED: {
    title: "Inspect ledger validation errors",
    steps: [
      "Check script witnesses, redeemers, and protocol params",
      "Rebuild and resubmit after correcting ledger constraints"
    ]
  },
  TX_SCRIPT_EVALUATION_FAILED: {
    title: "Fix script execution failure",
    steps: [
      "Inspect script/redeemer data and execution units",
      "Adjust datum/redeemer or budget and retry"
    ]
  }
};

export function getResolutionForCode(
  code: CardanoErrorCode
): ErrorResolution | undefined {
  const resolution = RESOLUTIONS_BY_CODE[code];
  if (!resolution) {
    return undefined;
  }

  return {
    ...resolution,
    steps: [...resolution.steps]
  };
}
