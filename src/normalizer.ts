import type {
  AdapterFn,
  CardanoAppError,
  NormalizeContext,
  Normalizer,
  NormalizerConfig
} from "./types.ts";
import { fromBlockfrostError } from "./adapters/blockfrost.ts";
import { fromMeshError } from "./adapters/mesh.ts";
import { fromNodeStringError } from "./adapters/node-string.ts";
import { fromWalletError } from "./adapters/wallet.ts";
import { createErrorFingerprint } from "./utils/fingerprint.ts";
import { extractErrorMessage } from "./utils/guards.ts";

const DEFAULT_CONFIG: NormalizerConfig = {
  adapters: [fromMeshError, fromWalletError, fromBlockfrostError, fromNodeStringError],
  includeFingerprint: false
};

export function createNormalizer(
  config?: Partial<NormalizerConfig>
): Normalizer {
  const resolvedConfig: NormalizerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    adapters: config?.adapters ?? DEFAULT_CONFIG.adapters
  };

  return {
    normalize(err: unknown, ctx: NormalizeContext): CardanoAppError {
      for (const adapter of resolvedConfig.adapters) {
        const adapted = runAdapter(adapter, err, ctx);
        if (adapted !== null) {
          return finalizeError(adapted, err, ctx, resolvedConfig);
        }
      }

      return finalizeError({
        code: "UNKNOWN",
        message: extractErrorMessage(err),
        severity: "error"
      }, err, ctx, resolvedConfig);
    }
  };
}

function runAdapter(
  adapter: AdapterFn,
  err: unknown,
  ctx: NormalizeContext
): CardanoAppError | Partial<CardanoAppError> | null {
  try {
    return adapter(err, ctx);
  } catch {
    return null;
  }
}

function finalizeError(
  candidate: Partial<CardanoAppError>,
  raw: unknown,
  ctx: NormalizeContext,
  config: NormalizerConfig
): CardanoAppError {
  const output: CardanoAppError = {
    name: "CardanoAppError",
    source: candidate.source ?? ctx.source,
    stage: candidate.stage ?? ctx.stage,
    code: candidate.code ?? "UNKNOWN",
    severity: candidate.severity ?? "error",
    message: candidate.message ?? extractErrorMessage(raw),
    detail: candidate.detail,
    timestamp: candidate.timestamp ?? ctx.timestamp ?? new Date().toISOString(),
    network: candidate.network ?? ctx.network ?? "unknown",
    provider: candidate.provider ?? ctx.provider,
    wallet: candidate.wallet ?? (ctx.walletHint ? { name: ctx.walletHint } : undefined),
    txHash: candidate.txHash ?? ctx.txHash,
    txCborHexHash: candidate.txCborHexHash,
    raw: candidate.raw ?? raw,
    meta: candidate.meta
  };

  if (config.includeFingerprint) {
    output.fingerprint =
      candidate.fingerprint ??
      createErrorFingerprint(
        [output.source, output.stage, output.code, output.provider ?? "unknown"].join("|")
      );
  } else if (candidate.fingerprint) {
    output.fingerprint = candidate.fingerprint;
  }

  return output;
}
