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
