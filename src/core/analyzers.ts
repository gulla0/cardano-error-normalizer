import { extractErrorMessage } from "../utils/guards.ts";

type InferredMeta = Record<string, unknown>;

const NODE_LEDGER_PATTERN =
  /DeserialiseFailure|DecoderFailure|expected word|BadInputsUTxO|OutputTooSmallUTxO|BabbageOutputTooSmallUTxO|ValueNotConservedUTxO|ScriptFailure|PlutusFailure|EvaluationFailure|ValidationTagMismatch|redeemer.*execution units|ShelleyTxValidationError|ApplyTxError/i;
const CONNECTIVITY_PATTERN =
  /failed to fetch|no connection|network(?:\s+is)?\s+(?:offline|down|unreachable)|econnrefused|enotfound|ehostunreach/i;

export function inferErrorMeta(err: unknown): InferredMeta {
  const blockfrost = inferBlockfrostMeta(err);
  if (blockfrost !== null) {
    return blockfrost;
  }

  const wallet = inferWalletMeta(err);
  if (wallet !== null) {
    return wallet;
  }

  const node = inferNodeMeta(err);
  if (node !== null) {
    return node;
  }

  const connectivity = inferConnectivityMeta(err);
  if (connectivity !== null) {
    return connectivity;
  }

  return {};
}

function inferBlockfrostMeta(err: unknown): InferredMeta | null {
  for (const candidate of collectCandidates(err)) {
    if (candidate === null || typeof candidate !== "object") {
      continue;
    }

    const statusCode = (candidate as { status_code?: unknown }).status_code;
    if (typeof statusCode !== "number" || !Number.isInteger(statusCode)) {
      continue;
    }

    const inferred: InferredMeta = {
      inferredProvider: "blockfrost",
      inferredKind: "blockfrost_http",
      httpStatus: statusCode
    };
    const reason = mapBlockfrostReason(statusCode);
    if (reason) {
      inferred.blockfrostReason = reason;
    }

    return inferred;
  }

  return null;
}

function inferWalletMeta(err: unknown): InferredMeta | null {
  for (const candidate of collectCandidates(err)) {
    if (candidate === null || typeof candidate !== "object") {
      continue;
    }

    const code = (candidate as { code?: unknown }).code;
    const info = (candidate as { info?: unknown }).info;

    if (typeof code !== "number" || !Number.isInteger(code)) {
      continue;
    }
    if (typeof info !== "string" || info.length === 0) {
      continue;
    }

    return {
      inferredProvider: "wallet",
      inferredKind: "wallet_cip_numeric"
    };
  }

  return null;
}

function inferNodeMeta(err: unknown): InferredMeta | null {
  const message = extractErrorMessage(err);
  if (!NODE_LEDGER_PATTERN.test(message)) {
    return null;
  }

  return {
    inferredProvider: "cardano-node",
    inferredKind: "node_ledger_string"
  };
}

function inferConnectivityMeta(err: unknown): InferredMeta | null {
  const message = extractErrorMessage(err);
  if (!CONNECTIVITY_PATTERN.test(message)) {
    return null;
  }

  return {
    inferredProvider: "network",
    inferredKind: "connectivity_unreachable"
  };
}

function collectCandidates(err: unknown): unknown[] {
  const queue: unknown[] = [err];
  const candidates: unknown[] = [];

  while (queue.length > 0) {
    const item = queue.shift();
    candidates.push(item);

    if (item === null || typeof item !== "object") {
      continue;
    }

    const obj = item as Record<string, unknown>;
    queue.push(obj.data, obj.error, obj.cause, obj.reason);

    if (obj.response !== null && typeof obj.response === "object") {
      queue.push((obj.response as Record<string, unknown>).data);
    }
  }

  return candidates;
}

function mapBlockfrostReason(statusCode: number): string | null {
  if (statusCode === 402) {
    return "daily_limit";
  }
  if (statusCode === 418) {
    return "auto_banned";
  }
  if (statusCode === 425) {
    return "mempool_full";
  }

  return null;
}
