import type { CardanoAppError, ErrorSource, ErrorStage } from "../types.ts";

interface WalletErrorShape {
  code: number;
  info: string;
}

interface WalletMapping {
  code: CardanoAppError["code"];
  source: ErrorSource;
  stage: ErrorStage;
  severity: CardanoAppError["severity"];
}

const API_ERROR_MAP: Record<number, WalletMapping> = {
  [-1]: {
    code: "WALLET_INVALID_REQUEST",
    source: "wallet_sign",
    stage: "sign",
    severity: "warn"
  },
  [-2]: {
    code: "WALLET_INTERNAL",
    source: "wallet_sign",
    stage: "sign",
    severity: "error"
  },
  [-3]: {
    code: "WALLET_REFUSED",
    source: "wallet_sign",
    stage: "sign",
    severity: "warn"
  },
  [-4]: {
    code: "WALLET_ACCOUNT_CHANGED",
    source: "wallet_sign",
    stage: "sign",
    severity: "warn"
  }
};

const POSITIVE_CODE_INFO_MAP: Record<string, WalletMapping> = {
  "1:proofgeneration": {
    code: "WALLET_SIGN_PROOF_GENERATION",
    source: "wallet_sign",
    stage: "sign",
    severity: "error"
  },
  "2:userdeclined": {
    code: "WALLET_SIGN_USER_DECLINED",
    source: "wallet_sign",
    stage: "sign",
    severity: "warn"
  },
  "3:deprecatedcertificate": {
    code: "TX_LEDGER_VALIDATION_FAILED",
    source: "wallet_sign",
    stage: "sign",
    severity: "error"
  },
  "1:refused": {
    code: "WALLET_SUBMIT_REFUSED",
    source: "wallet_submit",
    stage: "submit",
    severity: "warn"
  },
  "2:failure": {
    code: "WALLET_SUBMIT_FAILURE",
    source: "wallet_submit",
    stage: "submit",
    severity: "error"
  }
};

export function fromWalletError(err: unknown): Partial<CardanoAppError> | null {
  const walletError = extractWalletError(err);
  if (walletError === null) {
    return null;
  }

  const apiMapping = API_ERROR_MAP[walletError.code];
  if (apiMapping !== undefined) {
    return buildWalletResult(apiMapping, walletError, err);
  }

  const infoKey = normalizeInfo(walletError.info);
  if (infoKey === "") {
    return null;
  }

  const mapped = POSITIVE_CODE_INFO_MAP[`${walletError.code}:${infoKey}`];
  if (mapped === undefined) {
    return null;
  }

  return buildWalletResult(mapped, walletError, err);
}

function buildWalletResult(
  mapping: WalletMapping,
  walletError: WalletErrorShape,
  raw: unknown
): Partial<CardanoAppError> {
  return {
    source: mapping.source,
    stage: mapping.stage,
    code: mapping.code,
    severity: mapping.severity,
    message: walletError.info,
    raw,
    meta: {
      walletCode: walletError.code,
      walletInfo: walletError.info
    }
  };
}

function extractWalletError(err: unknown): WalletErrorShape | null {
  const candidates = collectCandidates(err);

  for (const candidate of candidates) {
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

    return { code, info };
  }

  return null;
}

function collectCandidates(err: unknown): unknown[] {
  const queue: unknown[] = [err];
  const roots: unknown[] = [];

  while (queue.length > 0) {
    const item = queue.shift();
    roots.push(item);

    if (item === null || typeof item !== "object") {
      continue;
    }

    const obj = item as Record<string, unknown>;
    queue.push(obj.error, obj.cause, obj.data, obj.reason);

    if (obj.response !== null && typeof obj.response === "object") {
      queue.push((obj.response as Record<string, unknown>).data);
    }
  }

  return roots;
}

function normalizeInfo(info: string): string {
  return info.toLowerCase().replace(/[^a-z]/g, "");
}
