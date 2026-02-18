import type {
  CardanoAppError,
  ErrorSource,
  ErrorStage,
  NormalizeContext
} from "../types.ts";

interface WalletErrorShape {
  code: number;
  info: string;
  familyHint?: "tx_sign" | "tx_send" | "data_sign";
}

interface PaginateErrorShape {
  maxSize: number;
  message: string;
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

export function fromWalletError(
  err: unknown,
  ctx?: NormalizeContext
): Partial<CardanoAppError> | null {
  const paginateError = extractPaginateError(err);
  if (paginateError !== null) {
    return {
      source: "wallet_query",
      stage: "build",
      code: "WALLET_PAGINATION_OUT_OF_RANGE",
      severity: "warn",
      message: paginateError.message,
      raw: err,
      meta: {
        walletPaginateMaxSize: paginateError.maxSize
      }
    };
  }

  const walletError = extractWalletError(err);
  if (walletError === null) {
    return null;
  }

  const apiMapping = resolveApiMapping(walletError, ctx);
  if (apiMapping !== undefined) {
    return buildWalletResult(apiMapping, walletError, err);
  }

  const infoKeys = resolveInfoKeys(walletError.info);
  if (infoKeys.length === 0) {
    return null;
  }

  const dataSignMapping = mapDataSignError(walletError, infoKeys);
  if (dataSignMapping !== null) {
    return buildWalletResult(dataSignMapping, walletError, err);
  }

  for (const infoKey of infoKeys) {
    const mapped = POSITIVE_CODE_INFO_MAP[`${walletError.code}:${infoKey}`];
    if (mapped === undefined) {
      continue;
    }

    return buildWalletResult(
      mapped,
      walletError,
      err,
      walletError.code === 3 && infoKey === "deprecatedcertificate"
        ? { cip95DeprecatedCertificate: true }
        : undefined
    );
  }

  return null;
}

function resolveApiMapping(
  walletError: WalletErrorShape,
  ctx?: NormalizeContext
): WalletMapping | undefined {
  const apiMapping = API_ERROR_MAP[walletError.code];
  if (apiMapping === undefined) {
    return undefined;
  }

  if (
    walletError.code === -2 &&
    (ctx?.source === "wallet_submit" ||
      ctx?.stage === "submit" ||
      infoLooksLikeSubmitFailure(walletError.info))
  ) {
    return {
      code: "WALLET_SUBMIT_FAILURE",
      source: "wallet_submit",
      stage: "submit",
      severity: "error"
    };
  }

  return apiMapping;
}

function buildWalletResult(
  mapping: WalletMapping,
  walletError: WalletErrorShape,
  raw: unknown,
  extraMeta?: Record<string, unknown>
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
      walletInfo: walletError.info,
      ...extraMeta
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

    return { code, info, familyHint: inferWalletFamily(candidate) };
  }

  return null;
}

function mapDataSignError(
  walletError: WalletErrorShape,
  infoKeys: string[]
): WalletMapping | null {
  if (walletError.familyHint !== "data_sign" && !infoKeys.includes("addressnotpk")) {
    return null;
  }

  if (walletError.code === 1 && infoKeys.includes("proofgeneration")) {
    return {
      code: "WALLET_DATA_SIGN_PROOF_GENERATION",
      source: "wallet_sign",
      stage: "sign",
      severity: "error"
    };
  }

  if (walletError.code === 2 && infoKeys.includes("addressnotpk")) {
    return {
      code: "WALLET_DATA_SIGN_ADDRESS_NOT_PK",
      source: "wallet_sign",
      stage: "sign",
      severity: "warn"
    };
  }

  if (walletError.code === 3 && infoKeys.includes("userdeclined")) {
    return {
      code: "WALLET_DATA_SIGN_USER_DECLINED",
      source: "wallet_sign",
      stage: "sign",
      severity: "warn"
    };
  }

  return null;
}

function extractPaginateError(err: unknown): PaginateErrorShape | null {
  const candidates = collectCandidates(err);

  for (const candidate of candidates) {
    if (candidate === null || typeof candidate !== "object") {
      continue;
    }

    const maxSize = (candidate as { maxSize?: unknown }).maxSize;
    if (typeof maxSize !== "number" || !Number.isFinite(maxSize) || maxSize < 0) {
      continue;
    }

    const messageValue = (candidate as { message?: unknown }).message;
    const message =
      typeof messageValue === "string" && messageValue.length > 0
        ? messageValue
        : `Pagination out of range (maxSize=${maxSize})`;

    return { maxSize, message };
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

function inferWalletFamily(candidate: unknown): WalletErrorShape["familyHint"] {
  if (candidate === null || typeof candidate !== "object") {
    return undefined;
  }

  const obj = candidate as Record<string, unknown>;
  const text = [
    obj.name,
    obj.type,
    obj.kind,
    obj.errorType,
    obj.method,
    obj.message
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (text.includes("datasign") || text.includes("signdata")) {
    return "data_sign";
  }

  if (text.includes("txsign") || text.includes("signtx")) {
    return "tx_sign";
  }

  if (text.includes("txsend") || text.includes("submittx")) {
    return "tx_send";
  }

  return undefined;
}

function resolveInfoKeys(info: string): string[] {
  const normalized = info.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.length === 0) {
    return [];
  }

  const keys = new Set<string>([normalized]);

  if (normalized.includes("proofgeneration")) {
    keys.add("proofgeneration");
  }

  if (normalized.includes("userdeclined")) {
    keys.add("userdeclined");
  }

  if (normalized.includes("deprecatedcertificate")) {
    keys.add("deprecatedcertificate");
  }

  if (
    normalized.includes("addressnotpk") ||
    (normalized.includes("address") &&
      (normalized.includes("p2pk") || normalized.includes("pk")) &&
      normalized.includes("not"))
  ) {
    keys.add("addressnotpk");
  }

  if (normalized.includes("refused")) {
    keys.add("refused");
  }

  if (normalized.includes("failure")) {
    keys.add("failure");
  }

  return [...keys];
}

function infoLooksLikeSubmitFailure(info: string): boolean {
  const normalized = info.toLowerCase().replace(/[^a-z]/g, "");
  return normalized.includes("submittx");
}
