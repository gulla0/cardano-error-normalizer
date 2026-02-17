import type { CardanoAppError } from "../types.ts";
import { extractErrorMessage } from "../utils/guards.ts";

const DESERIALISE_PATTERN = /DeserialiseFailure|DecoderFailure|expected word/i;
const BAD_INPUTS_PATTERN = /BadInputsUTxO/i;
const OUTPUT_TOO_SMALL_PATTERN = /OutputTooSmallUTxO|BabbageOutputTooSmallUTxO/i;
const VALUE_NOT_CONSERVED_PATTERN = /ValueNotConservedUTxO/i;
const SCRIPT_FAILURE_PATTERN =
  /ScriptFailure|PlutusFailure|EvaluationFailure|ValidationTagMismatch|redeemer.*execution units/i;
const WRAPPER_PATTERN = /ShelleyTxValidationError|ApplyTxError/i;

export function fromNodeStringError(err: unknown): Partial<CardanoAppError> | null {
  const message = extractErrorMessage(err);
  if (message === "Unknown Cardano error") {
    return null;
  }

  const code = mapMessageToCode(message);
  if (code === null) {
    return null;
  }

  return {
    source: "node_submit",
    stage: "submit",
    code,
    severity: "error",
    message,
    raw: err
  };
}

function mapMessageToCode(message: string): CardanoAppError["code"] | null {
  if (DESERIALISE_PATTERN.test(message)) {
    return "TX_DESERIALISE_FAILURE";
  }
  if (BAD_INPUTS_PATTERN.test(message)) {
    return "TX_INPUTS_MISSING_OR_SPENT";
  }
  if (OUTPUT_TOO_SMALL_PATTERN.test(message)) {
    return "TX_OUTPUT_TOO_SMALL";
  }
  if (VALUE_NOT_CONSERVED_PATTERN.test(message)) {
    return "TX_VALUE_NOT_CONSERVED";
  }
  if (SCRIPT_FAILURE_PATTERN.test(message)) {
    return "TX_SCRIPT_EVALUATION_FAILED";
  }
  if (WRAPPER_PATTERN.test(message)) {
    return "TX_LEDGER_VALIDATION_FAILED";
  }

  return null;
}
