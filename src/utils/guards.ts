import type { CardanoAppError } from "../types.ts";

export function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") {
    return err;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return "Unknown Cardano error";
}

export function isCardanoAppError(err: unknown): err is CardanoAppError {
  if (err === null || typeof err !== "object") {
    return false;
  }

  const candidate = err as Partial<CardanoAppError>;
  return (
    candidate.name === "CardanoAppError" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.stage === "string"
  );
}
