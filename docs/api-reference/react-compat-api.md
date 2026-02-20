# React Compat API (`@gulla0/cardano-error-normalizer/react/compat`)

## Value Exports

### `useCardanoError`
```ts
function useCardanoError<TArgs extends unknown[], TData>(
  options?: UseCardanoErrorCompatConfig<TArgs, TData>
): UseCardanoErrorCompatResult<TArgs, TData>;
```
Definition: compatibility version of `useCardanoError` that can resolve hooks from `globalThis.React` when `config.hooks` is not provided (for legacy/non-standard runtime setups).

## Type Exports

### `HookBindings`
```ts
interface HookBindings {
  useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void];
  useCallback<T extends (...args: any[]) => unknown>(
    callback: T,
    deps: readonly unknown[]
  ): T;
}
```
Definition: minimal hook runtime contract used by compat hook construction.

### `UseCardanoOpOptions<TArgs>`
```ts
interface UseCardanoOpOptions<TArgs extends unknown[]> {
  ctx: Partial<NormalizeContext> | ((...args: TArgs) => Partial<NormalizeContext>);
  normalizer?: Normalizer;
  onError?: (normalized: CardanoAppError, args: TArgs) => void;
}
```
Definition: operation-runner options re-exported from `react/useCardanoOp`.

### `UseCardanoOpResult<TArgs, TData>`
```ts
interface UseCardanoOpResult<TArgs extends unknown[], TData> {
  loading: boolean;
  data: TData | undefined;
  error: CardanoAppError | undefined;
  run: (...args: TArgs) => Promise<TData>;
  reset: () => void;
}
```
Definition: operation state/result contract re-exported from `react/useCardanoOp`.

### `UseCardanoErrorCompatConfig<TArgs, TData>`
```ts
interface UseCardanoErrorCompatConfig<TArgs extends unknown[], TData> {
  operation?: (...args: TArgs) => Promise<TData>;
  defaults?: Partial<NormalizeContext> | ((...args: TArgs) => Partial<NormalizeContext>);
  config?: {
    normalizer?: Normalizer;
    normalizerConfig?: Partial<NormalizerConfig>;
    onError?: (normalized: CardanoAppError, args: TArgs) => void;
    hooks?: HookBindings;
  };
}
```
Definition: compat hook config; differs from `./react` by allowing global runtime binding fallback when hooks are omitted.

### `UseCardanoErrorCompatResult<TArgs, TData>`
```ts
interface UseCardanoErrorCompatResult<TArgs extends unknown[], TData>
  extends UseCardanoOpResult<TArgs, TData> {
  normalize: (raw: unknown, overrideCtx?: Partial<NormalizeContext>) => CardanoAppError;
}
```
Definition: compat hook result + direct ad hoc normalizer helper.
