import { globalNormalizer } from "../config/errors.ts";
import type { CardanoAppError, NormalizeContext, Normalizer } from "../types.ts";

type SetStateAction<T> = T | ((prev: T) => T);
type StateSetter<T> = (value: SetStateAction<T>) => void;

export interface HookBindings {
  useState<T>(initial: T): [T, StateSetter<T>];
  useCallback<T extends (...args: any[]) => unknown>(callback: T, deps: readonly unknown[]): T;
}

export interface UseCardanoOpOptions<TArgs extends unknown[]> {
  ctx: NormalizeContext | ((...args: TArgs) => NormalizeContext);
  normalizer?: Normalizer;
  onError?: (normalized: CardanoAppError, args: TArgs) => void;
}

export interface UseCardanoOpResult<TArgs extends unknown[], TData> {
  loading: boolean;
  data: TData | undefined;
  error: CardanoAppError | undefined;
  run: (...args: TArgs) => Promise<TData>;
  reset: () => void;
}

export function createUseCardanoOp(bindings: HookBindings) {
  return function useCardanoOp<TArgs extends unknown[], TData>(
    operation: (...args: TArgs) => Promise<TData>,
    options: UseCardanoOpOptions<TArgs>
  ): UseCardanoOpResult<TArgs, TData> {
    const normalizer = options.normalizer ?? globalNormalizer;

    const [loading, setLoading] = bindings.useState(false);
    const [data, setData] = bindings.useState<TData | undefined>(undefined);
    const [error, setError] = bindings.useState<CardanoAppError | undefined>(undefined);

    const run = bindings.useCallback(
      async (...args: TArgs): Promise<TData> => {
        setLoading(true);
        setError(undefined);

        try {
          const result = await operation(...args);
          setData(result);
          return result;
        } catch (err) {
          const ctx = typeof options.ctx === "function" ? options.ctx(...args) : options.ctx;
          const normalized = normalizer.normalize(err, ctx);
          setError(normalized);
          options.onError?.(normalized, args);
          throw normalized;
        } finally {
          setLoading(false);
        }
      },
      [normalizer, operation, options]
    );

    const reset = bindings.useCallback(() => {
      setLoading(false);
      setData(undefined);
      setError(undefined);
    }, []);

    return { loading, data, error, run, reset };
  };
}
