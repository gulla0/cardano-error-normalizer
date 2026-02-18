import type { CardanoErrorCode } from "./codes.ts";

export type ErrorSource =
  | "mesh_build"
  | "wallet_sign"
  | "wallet_submit"
  | "provider_query"
  | "provider_submit"
  | "node_submit";

export type ErrorStage = "build" | "sign" | "submit";
export type ErrorSeverity = "debug" | "info" | "warn" | "error";

export interface ErrorResolution {
  title: string;
  steps: string[];
  docsUrl?: string;
}

export interface CardanoAppError {
  name: "CardanoAppError";
  source: ErrorSource;
  stage: ErrorStage;
  code: CardanoErrorCode;
  severity: ErrorSeverity;
  message: string;
  detail?: string;
  timestamp: string;
  network?: "mainnet" | "preprod" | "preview" | "sanchonet" | "unknown";
  provider?: "blockfrost" | "koios" | "ogmios" | "cardano-node" | string;
  wallet?: { name?: string; apiVersion?: string; version?: string };
  txHash?: string;
  txCborHexHash?: string;
  raw: unknown;
  originalError: unknown;
  resolution?: ErrorResolution;
  fingerprint?: string;
  meta?: Record<string, unknown>;
}

export interface NormalizeContext {
  source: ErrorSource;
  stage: ErrorStage;
  network?: CardanoAppError["network"];
  provider?: string;
  walletHint?: string;
  txHash?: string;
  timestamp?: string;
}

export type AdapterFn = (
  err: unknown,
  ctx: NormalizeContext
) => CardanoAppError | Partial<CardanoAppError> | null;

export interface Normalizer {
  normalize(err: unknown, ctx: NormalizeContext): CardanoAppError;
}

export interface NormalizerConfig {
  adapters: AdapterFn[];
  includeFingerprint: boolean;
  debug: boolean;
  parseTraces: boolean;
}
