import type { CardanoAppError, NormalizeContext } from "../types.ts";
import { fromBlockfrostError } from "./blockfrost.ts";
import { fromNodeStringError } from "./node-string.ts";
import { fromWalletError } from "./wallet.ts";

type DelegateFn = (err: unknown) => Partial<CardanoAppError> | null;

const DEFAULT_DELEGATES: DelegateFn[] = [
  fromWalletError,
  fromBlockfrostError,
  fromNodeStringError
];

const NESTED_KEYS = [
  "error",
  "cause",
  "reason",
  "data",
  "details",
  "innerError",
  "originalError"
] as const;

export function fromMeshError(
  err: unknown,
  _ctx: NormalizeContext,
  delegates: DelegateFn[] = DEFAULT_DELEGATES
): Partial<CardanoAppError> | null {
  const nested = collectNestedCandidates(err);
  if (nested.length === 0) {
    return null;
  }

  for (const candidate of nested) {
    for (const delegate of delegates) {
      const mapped = delegate(candidate);
      if (mapped !== null) {
        return {
          ...mapped,
          raw: err,
          meta: {
            ...(mapped.meta ?? {}),
            meshUnwrapped: true
          }
        };
      }
    }
  }

  return null;
}

function collectNestedCandidates(err: unknown): unknown[] {
  if (err === null || typeof err !== "object") {
    return [];
  }

  const queue: unknown[] = [err];
  const seen = new Set<unknown>([err]);
  const nested: unknown[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === null || typeof current !== "object") {
      continue;
    }

    const obj = current as Record<string, unknown>;
    for (const key of NESTED_KEYS) {
      const value = obj[key];
      if (value === undefined || value === null) {
        continue;
      }
      if (seen.has(value)) {
        continue;
      }

      seen.add(value);
      nested.push(value);
      queue.push(value);
    }

    if (obj.response !== null && typeof obj.response === "object") {
      const responseData = (obj.response as Record<string, unknown>).data;
      if (responseData !== undefined && responseData !== null && !seen.has(responseData)) {
        seen.add(responseData);
        nested.push(responseData);
        queue.push(responseData);
      }
    }
  }

  return nested;
}
