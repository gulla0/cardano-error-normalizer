import { createSmartNormalizer } from "../core/normalize.ts";
import type { CardanoAppError, NormalizeConfig, NormalizeContext } from "../types.ts";
import { inferErrorMeta } from "../core/analyzers.ts";

export const globalNormalizer = createSmartNormalizer();

export function normalizeError(
  err: unknown,
  ctx?: Partial<NormalizeContext>,
  config?: NormalizeConfig
): CardanoAppError {
  const normalized = config
    ? createSmartNormalizer({ config, defaults: ctx }).normalize(err)
    : globalNormalizer.normalize(err, ctx);
  const inferredMeta = inferErrorMeta(err);

  return {
    ...normalized,
    source: ctx?.source ?? normalized.source,
    stage: ctx?.stage ?? normalized.stage,
    meta: mergeMeta(normalized.meta, inferredMeta)
  };
}

function mergeMeta(
  coreMeta: Record<string, unknown> | undefined,
  inferredMeta: Record<string, unknown>
): Record<string, unknown> | undefined {
  const merged = {
    ...(coreMeta ?? {}),
    ...inferredMeta
  };
  if (Object.keys(merged).length === 0) {
    return undefined;
  }

  return merged;
}
