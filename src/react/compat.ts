import { globalNormalizer } from "../config/errors.ts";
import { createSmartNormalizer } from "../core/normalize.ts";
import type { CardanoAppError, NormalizeContext, Normalizer, NormalizerConfig } from "../types.ts";
import {
  createUseCardanoOp,
  type HookBindings,
  type UseCardanoOpResult
} from "./useCardanoOp.ts";

export type {
  HookBindings,
  UseCardanoOpOptions,
  UseCardanoOpResult
} from "./useCardanoOp.ts";

export interface UseCardanoErrorCompatConfig<TArgs extends unknown[], TData> {
  operation?: (...args: TArgs) => Promise<TData>;
  defaults?: Partial<NormalizeContext> | ((...args: TArgs) => Partial<NormalizeContext>);
  config?: {
    normalizer?: Normalizer;
    normalizerConfig?: Partial<NormalizerConfig>;
    onError?: (normalized: CardanoAppError, args: TArgs) => void;
    hooks?: HookBindings;
  };
}

export interface UseCardanoErrorCompatResult<TArgs extends unknown[], TData>
  extends UseCardanoOpResult<TArgs, TData> {
  normalize: (raw: unknown, overrideCtx?: Partial<NormalizeContext>) => CardanoAppError;
}

export function useCardanoError<TArgs extends unknown[], TData>(
  options: UseCardanoErrorCompatConfig<TArgs, TData> = {}
): UseCardanoErrorCompatResult<TArgs, TData> {
  const hooks = options.config?.hooks ?? resolveReactBindingsFromRuntime();
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

type RuntimeUseState = HookBindings["useState"];
type RuntimeUseCallback = HookBindings["useCallback"];
type RuntimeReactLike = {
  useState?: RuntimeUseState;
  useCallback?: RuntimeUseCallback;
};

function resolveReactBindingsFromRuntime(): HookBindings {
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

  throw new Error(
    "React runtime hooks are unavailable. Expose `globalThis.React` or pass config.hooks explicitly."
  );
}
