import type { CardanoErrorCode } from "../codes.ts";
import { createNormalizer } from "../normalizer.ts";
import type {
  CardanoAppError,
  NormalizeConfig,
  NormalizeContext,
  Normalizer,
  NormalizerConfig
} from "../types.ts";
import { extractErrorMessage } from "../utils/guards.ts";
import { getResolutionForCode } from "./resolutions.ts";

interface MessageMatcher {
  id: string;
  pattern: RegExp;
  code: CardanoErrorCode;
  severity: CardanoAppError["severity"];
}

const MESSAGE_MATCHERS: MessageMatcher[] = [
  {
    id: "timeout",
    pattern: /\btimeout\b|timed out|request timeout|operation timeout/i,
    code: "TIMEOUT",
    severity: "warn"
  },
  {
    id: "network_unreachable",
    pattern:
      /failed to fetch|no connection|network(?:\s+is)?\s+(?:offline|down|unreachable)|econnrefused|enotfound|ehostunreach/i,
    code: "NETWORK_UNREACHABLE",
    severity: "error"
  },
  {
    id: "rate_limited",
    pattern: /too many requests|rate.?limit/i,
    code: "RATE_LIMITED",
    severity: "warn"
  },
  {
    id: "quota_exceeded",
    pattern: /daily request limit|quota exceeded|project over limit|usage is over limit/i,
    code: "QUOTA_EXCEEDED",
    severity: "warn"
  }
];

export function createSmartNormalizer(
  options?: { config?: NormalizerConfig; defaults?: Partial<NormalizeContext> } | NormalizerConfig
): Normalizer {
  const normalizedOptions = normalizeSmartOptions(options);
  const baseNormalizer = createNormalizer(normalizedOptions);

  return {
    normalize(err: unknown, ctx?: Partial<NormalizeContext>): CardanoAppError {
      let normalized = baseNormalizer.normalize(err, ctx);

      normalized = applyMessageMatcher(normalized, err);
      normalized = attachResolution(normalized);

      if (normalizedOptions.config?.parseTraces) {
        normalized = attachTraceMeta(normalized, err);
      }

      if (normalizedOptions.config?.debug) {
        debugNormalize(err, ctx, normalized);
      }

      return normalized;
    },

    withDefaults(moreDefaults: Partial<NormalizeContext>): Normalizer {
      return createSmartNormalizer({
        config: normalizedOptions.config,
        defaults: {
          ...(normalizedOptions.defaults ?? {}),
          ...moreDefaults
        }
      });
    }
  };
}

function applyMessageMatcher(
  normalized: CardanoAppError,
  err: unknown
): CardanoAppError {
  if (normalized.code !== "UNKNOWN") {
    return normalized;
  }

  const message = extractErrorMessage(err);
  if (message === "Unknown Cardano error") {
    return normalized;
  }

  for (const matcher of MESSAGE_MATCHERS) {
    if (!matcher.pattern.test(message)) {
      continue;
    }

    return {
      ...normalized,
      code: matcher.code,
      severity: matcher.severity,
      message,
      meta: {
        ...normalized.meta,
        smartMatcher: matcher.id
      }
    };
  }

  return normalized;
}

function attachResolution(normalized: CardanoAppError): CardanoAppError {
  if (normalized.resolution) {
    return normalized;
  }

  const resolution = getResolutionForCode(normalized.code);
  if (!resolution) {
    return normalized;
  }

  return {
    ...normalized,
    resolution
  };
}

function attachTraceMeta(
  normalized: CardanoAppError,
  err: unknown
): CardanoAppError {
  const traceLines = extractTraceLines(err);
  if (traceLines.length === 0) {
    return normalized;
  }

  return {
    ...normalized,
    meta: {
      ...normalized.meta,
      traces: traceLines
    }
  };
}

function extractTraceLines(err: unknown): string[] {
  if (err === null || typeof err !== "object") {
    return [];
  }

  const traces: string[] = [];
  const obj = err as Record<string, unknown>;
  appendTraceValue(traces, obj.trace);
  appendTraceValue(traces, obj.traces);
  appendTraceValue(traces, obj.stack);

  if (obj.data !== null && typeof obj.data === "object") {
    const data = obj.data as Record<string, unknown>;
    appendTraceValue(traces, data.trace);
    appendTraceValue(traces, data.traces);
  }

  return traces.slice(0, 10);
}

function appendTraceValue(target: string[], value: unknown): void {
  if (typeof value === "string" && value.length > 0) {
    target.push(...value.split("\n").map((line) => line.trim()).filter(Boolean));
    return;
  }

  if (!Array.isArray(value)) {
    return;
  }

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const line = item.trim();
    if (line.length > 0) {
      target.push(line);
    }
  }
}

function debugNormalize(
  err: unknown,
  ctx: Partial<NormalizeContext> | undefined,
  normalized: CardanoAppError
): void {
  try {
    const group =
      typeof console.groupCollapsed === "function"
        ? console.groupCollapsed.bind(console)
        : typeof console.group === "function"
          ? console.group.bind(console)
          : null;

    group?.("[cardano-error-normalizer] normalize");
    console.debug?.("context", ctx);
    console.debug?.("input", err);
    console.debug?.("output", normalized);
    console.groupEnd?.();
  } catch {
    // Debug logging must never break normalization.
  }
}

function normalizeSmartOptions(
  options?: { config?: NormalizerConfig; defaults?: Partial<NormalizeContext> } | NormalizeConfig
): { config?: NormalizerConfig; defaults?: Partial<NormalizeContext> } {
  if (options === undefined) {
    return {};
  }

  if (isSmartOptions(options)) {
    return options;
  }

  return { config: options };
}

function isSmartOptions(
  options: { config?: NormalizerConfig; defaults?: Partial<NormalizeContext> } | NormalizeConfig
): options is { config?: NormalizerConfig; defaults?: Partial<NormalizeContext> } {
  return "config" in options || "defaults" in options;
}
