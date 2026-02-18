import type {
  CardanoAppError,
  ErrorSource,
  ErrorStage,
  Normalizer,
  NormalizerConfig
} from "../types.ts";
import { withErrorSafety } from "../utils/safeProvider.ts";

type OnError = (
  normalized: CardanoAppError,
  details: { method: string; args: unknown[] }
) => void;

export interface MeshProviderPresetOptions {
  provider?: string;
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: OnError;
}

const METHOD_CONTEXT: Record<string, { source: ErrorSource; stage: ErrorStage }> = {
  submitTx: { source: "provider_submit", stage: "submit" },
  fetchAddressUTxOs: { source: "provider_query", stage: "build" },
  fetchProtocolParameters: { source: "provider_query", stage: "build" },
  fetchAccountInfo: { source: "provider_query", stage: "build" }
};

const DEFAULT_CONTEXT = {
  source: "provider_query" as const,
  stage: "build" as const
};

export function meshProviderPreset<T extends object>(
  provider: T,
  options: MeshProviderPresetOptions = {}
): T {
  return withErrorSafety(provider, {
    normalizer: options.normalizer,
    normalizerConfig: options.normalizerConfig,
    onError: options.onError,
    ctx(method) {
      const mapped = METHOD_CONTEXT[method] ?? DEFAULT_CONTEXT;
      return {
        source: mapped.source,
        stage: mapped.stage,
        provider: options.provider
      };
    }
  });
}
