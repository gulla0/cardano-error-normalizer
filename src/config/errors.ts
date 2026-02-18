import { createNormalizer } from "../normalizer.ts";
import type { CardanoAppError, NormalizeContext } from "../types.ts";

export const globalNormalizer = createNormalizer();

export function normalizeError(
  err: unknown,
  ctx: NormalizeContext
): CardanoAppError {
  return globalNormalizer.normalize(err, ctx);
}
