import type { CardanoAppError } from "../types.ts";

interface BlockfrostShape {
  statusCode: number;
  error: string;
  message: string;
}

export function fromBlockfrostError(err: unknown): Partial<CardanoAppError> | null {
  const parsed = extractBlockfrostShape(err);
  if (parsed === null) {
    return null;
  }

  const code = mapStatusToCode(parsed.statusCode);
  if (code === null) {
    return null;
  }

  const meta: Record<string, unknown> = {
    blockfrostStatusCode: parsed.statusCode,
    blockfrostError: parsed.error,
    blockfrostMessage: parsed.message
  };

  if (parsed.statusCode === 402) {
    meta.blockfrostReason = "daily_limit";
  }
  if (parsed.statusCode === 418) {
    meta.blockfrostReason = "auto_banned";
  }
  if (parsed.statusCode === 425) {
    meta.blockfrostReason = "mempool_full";
  }

  return {
    provider: "blockfrost",
    code,
    severity: parsed.statusCode >= 500 ? "error" : "warn",
    message: parsed.message,
    raw: err,
    meta
  };
}

function mapStatusToCode(statusCode: number): CardanoAppError["code"] | null {
  if (statusCode === 400) {
    return "BAD_REQUEST";
  }
  if (statusCode === 402) {
    return "QUOTA_EXCEEDED";
  }
  if (statusCode === 403) {
    return "UNAUTHORIZED";
  }
  if (statusCode === 404) {
    return "NOT_FOUND";
  }
  if (statusCode === 418) {
    return "FORBIDDEN";
  }
  if (statusCode === 425) {
    return "MEMPOOL_FULL";
  }
  if (statusCode === 429) {
    return "RATE_LIMITED";
  }
  if (statusCode >= 500 && statusCode <= 599) {
    return "PROVIDER_INTERNAL";
  }
  if (statusCode >= 400 && statusCode <= 499) {
    return "BAD_REQUEST";
  }

  return null;
}

function extractBlockfrostShape(err: unknown): BlockfrostShape | null {
  const candidates = [err];

  if (err !== null && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    candidates.push(obj.data, obj.error, obj.cause, obj.reason);

    if (obj.response !== null && typeof obj.response === "object") {
      candidates.push((obj.response as Record<string, unknown>).data);
    }
  }

  for (const candidate of candidates) {
    if (candidate === null || typeof candidate !== "object") {
      continue;
    }

    const statusCode = (candidate as { status_code?: unknown }).status_code;
    const error = (candidate as { error?: unknown }).error;
    const message = (candidate as { message?: unknown }).message;

    if (typeof statusCode !== "number" || !Number.isInteger(statusCode)) {
      continue;
    }
    if (typeof error !== "string" || error.length === 0) {
      continue;
    }
    if (typeof message !== "string" || message.length === 0) {
      continue;
    }

    return {
      statusCode,
      error,
      message
    };
  }

  return null;
}
