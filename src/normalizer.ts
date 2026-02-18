import type {
  AdapterFn,
  CardanoAppError,
  NormalizeConfig,
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

interface ResolvedNormalizerConfig {
  adapters: AdapterFn[];
  includeFingerprint: boolean;
  debug: boolean;
  parseTraces: boolean;
}

interface CreateNormalizerOptions {
  config?: NormalizerConfig;
  defaults?: Partial<NormalizeContext>;
}

const DEFAULT_CONFIG: ResolvedNormalizerConfig = {
  adapters: [fromMeshError, fromWalletError, fromBlockfrostError, fromNodeStringError],
  includeFingerprint: false,
  debug: false,
  parseTraces: false
};

const DEFAULT_CONTEXT: NormalizeContext = {
  source: "provider_query",
  stage: "build"
};

export function createNormalizer(
  options?: CreateNormalizerOptions | NormalizerConfig
): Normalizer {
  const normalizedOptions = normalizeCreateOptions(options);
  const resolvedConfig: ResolvedNormalizerConfig = {
    ...DEFAULT_CONFIG,
    ...normalizedOptions.config,
    adapters: normalizedOptions.config?.adapters ?? DEFAULT_CONFIG.adapters
  };
  const resolvedDefaults = normalizedOptions.defaults ?? {};

  return {
    normalize(err: unknown, overrideCtx?: Partial<NormalizeContext>): CardanoAppError {
      const ctx = mergeContext(resolvedDefaults, overrideCtx);

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
    },

    withDefaults(moreDefaults: Partial<NormalizeContext>): Normalizer {
      return createNormalizer({
        config: resolvedConfig,
        defaults: {
          ...resolvedDefaults,
          ...moreDefaults
        }
      });
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
  config: ResolvedNormalizerConfig
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
    originalError: candidate.originalError ?? raw,
    resolution: candidate.resolution,
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

function normalizeCreateOptions(
  options?: CreateNormalizerOptions | NormalizeConfig
): CreateNormalizerOptions {
  if (options === undefined) {
    return {};
  }

  if (isCreateOptions(options)) {
    return options;
  }

  return { config: options };
}

function isCreateOptions(
  input: CreateNormalizerOptions | NormalizeConfig
): input is CreateNormalizerOptions {
  return "config" in input || "defaults" in input;
}

function mergeContext(
  defaults: Partial<NormalizeContext>,
  override?: Partial<NormalizeContext>
): NormalizeContext {
  return {
    source: override?.source ?? defaults.source ?? DEFAULT_CONTEXT.source,
    stage: override?.stage ?? defaults.stage ?? DEFAULT_CONTEXT.stage,
    network: override?.network ?? defaults.network,
    provider: override?.provider ?? defaults.provider,
    walletHint: override?.walletHint ?? defaults.walletHint,
    txHash: override?.txHash ?? defaults.txHash,
    timestamp: override?.timestamp ?? defaults.timestamp
  };
}
