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

export interface Cip30WalletPresetOptions {
  walletHint?: string;
  normalizer?: Normalizer;
  normalizerConfig?: Partial<NormalizerConfig>;
  onError?: OnError;
}

const METHOD_CONTEXT: Record<string, { source: ErrorSource; stage: ErrorStage }> = {
  getUtxos: { source: "wallet_query", stage: "build" },
  signTx: { source: "wallet_sign", stage: "sign" },
  signData: { source: "wallet_sign", stage: "sign" },
  submitTx: { source: "wallet_submit", stage: "submit" }
};

const DEFAULT_CONTEXT = {
  source: "wallet_query" as const,
  stage: "build" as const
};

export function cip30WalletPreset<T extends object>(
  walletApi: T,
  options: Cip30WalletPresetOptions = {}
): T {
  return withErrorSafety(walletApi, {
    normalizer: options.normalizer,
    normalizerConfig: options.normalizerConfig,
    onError: options.onError,
    ctx(method) {
      const mapped = METHOD_CONTEXT[method] ?? DEFAULT_CONTEXT;
      return {
        source: mapped.source,
        stage: mapped.stage,
        walletHint: options.walletHint
      };
    }
  });
}
