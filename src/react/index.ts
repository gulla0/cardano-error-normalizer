import { globalNormalizer } from "../config/errors.ts";
import { createSmartNormalizer } from "../core/normalize.ts";
import type { CardanoAppError, NormalizeContext, Normalizer, NormalizerConfig } from "../types.ts";
import {
  createUseCardanoOp,
  type HookBindings,
  type UseCardanoOpResult
} from "./useCardanoOp.ts";

export interface UseCardanoErrorConfig<TArgs extends unknown[], TData> {
  bindings: HookBindings;
  operation: (...args: TArgs) => Promise<TData>;
  ctx: NormalizeContext | ((...args: TArgs) => NormalizeContext);
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (normalized: CardanoAppError, args: TArgs) => void;
}

export interface ExecuteWithSafetyOptions<TArgs extends unknown[]> {
  ctx: NormalizeContext | ((...args: TArgs) => NormalizeContext);
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (normalized: CardanoAppError, args: TArgs) => void;
}

export function useCardanoError<TArgs extends unknown[], TData>(
  config: UseCardanoErrorConfig<TArgs, TData>
): UseCardanoOpResult<TArgs, TData> {
  const useCardanoOp = createUseCardanoOp(config.bindings);
  return useCardanoOp(config.operation, {
    ctx: config.ctx,
    normalizer: resolveNormalizer(config.normalizer, config.normalizerConfig),
    onError: config.onError
  });
}

export function executeWithSafety<TArgs extends unknown[], TData>(
  operation: (...args: TArgs) => Promise<TData>,
  options: ExecuteWithSafetyOptions<TArgs>
): (...args: TArgs) => Promise<TData> {
  const normalizer = resolveNormalizer(options.normalizer, options.normalizerConfig);

  return async (...args: TArgs): Promise<TData> => {
    try {
      return await operation(...args);
    } catch (err) {
      const ctx = typeof options.ctx === "function" ? options.ctx(...args) : options.ctx;
      const normalized = normalizer.normalize(err, ctx);
      options.onError?.(normalized, args);
      throw normalized;
    }
  };
}

function resolveNormalizer(
  normalizer?: Normalizer,
  normalizerConfig?: Partial<NormalizerConfig>
): Normalizer {
  if (normalizer) {
    return normalizer;
  }

  if (normalizerConfig) {
    return createSmartNormalizer(normalizerConfig);
  }

  return globalNormalizer;
}
