import { globalNormalizer } from "../config/errors.ts";
import { createSmartNormalizer } from "../core/normalize.ts";
import type {
  CardanoAppError,
  NormalizeContext,
  Normalizer,
  NormalizerConfig
} from "../types.ts";

export interface WithErrorSafetyOptions {
  ctx: NormalizeContext | ((method: string, args: unknown[]) => NormalizeContext);
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (
    normalized: CardanoAppError,
    details: { method: string; args: unknown[] }
  ) => void;
}

export function withErrorSafety<T extends object>(
  provider: T,
  options: WithErrorSafetyOptions
): T {
  const normalizer = resolveNormalizer(options);

  return new Proxy(provider, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") {
        return value;
      }

      return function wrappedMethod(this: unknown, ...args: unknown[]) {
        const method = String(prop);
        const ctx =
          typeof options.ctx === "function" ? options.ctx(method, args) : options.ctx;

        try {
          const result = Reflect.apply(value, target, args);
          if (isPromiseLike(result)) {
            return result.catch((err: unknown) => {
              throw normalizeAndAnnotateError(normalizer, err, ctx, method, args, options.onError);
            });
          }
          return result;
        } catch (err) {
          throw normalizeAndAnnotateError(normalizer, err, ctx, method, args, options.onError);
        }
      };
    }
  });
}

function resolveNormalizer(options: WithErrorSafetyOptions): Normalizer {
  if (options.normalizer) {
    return options.normalizer;
  }

  if (options.normalizerConfig) {
    return createSmartNormalizer(options.normalizerConfig);
  }

  return globalNormalizer;
}

function normalizeAndAnnotateError(
  normalizer: Normalizer,
  err: unknown,
  ctx: NormalizeContext,
  method: string,
  args: unknown[],
  onError: WithErrorSafetyOptions["onError"]
): CardanoAppError {
  const normalized = normalizer.normalize(err, ctx);
  const annotated: CardanoAppError = {
    ...normalized,
    meta: {
      ...normalized.meta,
      safeProviderWrapped: true,
      safeProviderMethod: method
    }
  };

  onError?.(annotated, { method, args });
  return annotated;
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
