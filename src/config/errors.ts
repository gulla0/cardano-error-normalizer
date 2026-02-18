import { createSmartNormalizer } from "../core/normalize.ts";
import type { CardanoAppError, NormalizeContext } from "../types.ts";

export const globalNormalizer = createSmartNormalizer();

export function normalizeError(
  err: unknown,
  ctx: NormalizeContext
): CardanoAppError {
  return globalNormalizer.normalize(err, ctx);
}
