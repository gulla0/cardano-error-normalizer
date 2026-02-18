import { createSmartNormalizer } from "../core/normalize.ts";
import type { CardanoAppError, NormalizeConfig, NormalizeContext } from "../types.ts";

export const globalNormalizer = createSmartNormalizer();

export function normalizeError(
  err: unknown,
  ctx?: Partial<NormalizeContext>,
  config?: NormalizeConfig
): CardanoAppError {
  if (config) {
    return createSmartNormalizer({ config, defaults: ctx }).normalize(err);
  }

  return globalNormalizer.normalize(err, ctx);
}
