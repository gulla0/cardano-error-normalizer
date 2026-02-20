# React API (`@gulla0/cardano-error-normalizer/react`)

## Value Exports

### `createUseCardanoOp`
```ts
function createUseCardanoOp(
  bindings: HookBindings
): <TArgs extends unknown[], TData>(
  operation: (...args: TArgs) => Promise<TData>,
  options: UseCardanoOpOptions<TArgs>
) => UseCardanoOpResult<TArgs, TData>;
```
Definition: factory for a React-hook-like operation runner using injected hook bindings. Manages `loading`, `data`, `error`, normalizes failures, and rethrows normalized errors.

### `useCardanoError`
```ts
function useCardanoError<TArgs extends unknown[], TData>(
  options?: UseCardanoErrorConfig<TArgs, TData>
): UseCardanoErrorResult<TArgs, TData>;
```
Definition: higher-level hook helper built on `createUseCardanoOp`. It resolves/creates a normalizer, executes optional async operations safely, and exposes an extra `normalize(raw, overrideCtx?)` helper.

### `executeWithSafety`
```ts
function executeWithSafety<TArgs extends unknown[], TData>(
  operation: (...args: TArgs) => Promise<TData>,
  options: ExecuteWithSafetyOptions<TArgs>
): (...args: TArgs) => Promise<TData>;
```
Definition: wraps a Promise-returning function and normalizes any thrown/rejected error with context derived from args.

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
Definition: minimal hook runtime contract required by `createUseCardanoOp`.

### `UseCardanoOpOptions<TArgs>`
```ts
interface UseCardanoOpOptions<TArgs extends unknown[]> {
  ctx: Partial<NormalizeContext> | ((...args: TArgs) => Partial<NormalizeContext>);
  normalizer?: Normalizer;
  onError?: (normalized: CardanoAppError, args: TArgs) => void;
}
```
Definition: execution context/normalizer/error callback options for operation hook runner.

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
Definition: normalized state/result contract returned by operation hook runner.

### `UseCardanoErrorConfig<TArgs, TData>`
```ts
interface UseCardanoErrorConfig<TArgs extends unknown[], TData> {
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
Definition: setup object for `useCardanoError`, including operation/default context and normalizer runtime behavior.

### `ExecuteWithSafetyOptions<TArgs>`
```ts
interface ExecuteWithSafetyOptions<TArgs extends unknown[]> {
  ctx: NormalizeContext | ((...args: TArgs) => NormalizeContext);
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: (normalized: CardanoAppError, args: TArgs) => void;
}
```
Definition: wrapper config for `executeWithSafety`.

### `UseCardanoErrorResult<TArgs, TData>`
```ts
interface UseCardanoErrorResult<TArgs extends unknown[], TData>
  extends UseCardanoOpResult<TArgs, TData> {
  normalize: (raw: unknown, overrideCtx?: Partial<NormalizeContext>) => CardanoAppError;
}
```
Definition: hook result + direct ad hoc normalizer access.
