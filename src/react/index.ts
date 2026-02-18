import { globalNormalizer } from "../config/errors.ts";
import { createSmartNormalizer } from "../core/normalize.ts";
import type { CardanoAppError, NormalizeContext, Normalizer, NormalizerConfig } from "../types.ts";
import {
  createUseCardanoOp,
  type HookBindings,
  type UseCardanoOpResult
} from "./useCardanoOp.ts";
export {
  createUseCardanoOp,
  type HookBindings,
  type UseCardanoOpOptions,
  type UseCardanoOpResult
} from "./useCardanoOp.ts";

export interface UseCardanoErrorConfig<TArgs extends unknown[], TData> {
  operation?: (...args: TArgs) => Promise<TData>;
  defaults?: Partial<NormalizeContext> | ((...args: TArgs) => Partial<NormalizeContext>);
  config?: {
    normalizer?: Normalizer;
    normalizerConfig?: Partial<NormalizerConfig>;
    onError?: (normalized: CardanoAppError, args: TArgs) => void;
    /**
     * Advanced compatibility override for non-standard runtimes or tests.
     * Prefer the default auto-binding path in real React applications.
     */
    hooks?: HookBindings;
  };
}

export interface ExecuteWithSafetyOptions<TArgs extends unknown[]> {
  ctx: NormalizeContext | ((...args: TArgs) => NormalizeContext);
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (normalized: CardanoAppError, args: TArgs) => void;
}

export interface UseCardanoErrorResult<TArgs extends unknown[], TData>
  extends UseCardanoOpResult<TArgs, TData> {
  normalize: (raw: unknown, overrideCtx?: Partial<NormalizeContext>) => CardanoAppError;
}

export function useCardanoError<TArgs extends unknown[], TData>(
  options: UseCardanoErrorConfig<TArgs, TData> = {}
): UseCardanoErrorResult<TArgs, TData> {
  const hooks = options.config?.hooks ?? defaultHookBindings();
  const useCardanoOp = createUseCardanoOp(hooks);
  const normalizer = resolveNormalizer(options.config?.normalizer, options.config?.normalizerConfig);
  const operation = options.operation ?? (async () => undefined as TData);

  const hook = useCardanoOp(operation, {
    ctx: (...args: TArgs) => resolveContext(options.defaults, args),
    normalizer,
    onError: options.config?.onError
  });

  return {
    ...hook,
    normalize(raw: unknown, overrideCtx?: Partial<NormalizeContext>): CardanoAppError {
      const mergedCtx = resolveContext(options.defaults, [] as unknown as TArgs, overrideCtx);
      return normalizer.normalize(raw, mergedCtx);
    }
  };
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

function resolveContext<TArgs extends unknown[]>(
  defaults:
    | Partial<NormalizeContext>
    | ((...args: TArgs) => Partial<NormalizeContext>)
    | undefined,
  args: TArgs,
  overrideCtx?: Partial<NormalizeContext>
): Partial<NormalizeContext> {
  const resolvedDefaults = typeof defaults === "function" ? defaults(...args) : defaults;
  return {
    ...resolvedDefaults,
    ...overrideCtx
  };
}

function defaultHookBindings(): HookBindings {
  const reactBindings = resolveReactBindingsFromRuntime();
  if (reactBindings) {
    return reactBindings;
  }

  throw new Error(
    "React runtime hooks are unavailable. Install `react` and call this hook inside a React component, or pass config.hooks for custom runtimes."
  );
}

type RuntimeUseState = HookBindings["useState"];
type RuntimeUseCallback = HookBindings["useCallback"];
type RuntimeReactLike = {
  useState?: RuntimeUseState;
  useCallback?: RuntimeUseCallback;
};

function resolveReactBindingsFromRuntime(): HookBindings | null {
  const candidate = globalThis as { React?: RuntimeReactLike };
  const runtimeReact = candidate.React;
  if (
    runtimeReact &&
    typeof runtimeReact.useState === "function" &&
    typeof runtimeReact.useCallback === "function"
  ) {
    return {
      useState: runtimeReact.useState,
      useCallback: runtimeReact.useCallback
    };
  }

  return null;
}
