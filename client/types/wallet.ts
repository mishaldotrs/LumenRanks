export type DappErrorCode =
  | "WALLET_NOT_FOUND"
  | "USER_REJECTED"
  | "INSUFFICIENT_BALANCE"
  | "SIMULATION_FAILED"
  | "NETWORK_MISMATCH"
  | "CONTRACT_NOT_CONFIGURED"
  | "UNKNOWN";

export class DappError extends Error {
  readonly code: DappErrorCode;

  constructor(code: DappErrorCode, message: string) {
    super(message);
    this.name = "DappError";
    this.code = code;
  }
}

/** Friendly messages for each on-chain `Error(Contract, #N)` code. */
export const CONTRACT_ERROR_MESSAGES: Record<number, string> = {
  1: "The contract has already been initialized.",
  2: "The contract hasn't been initialized yet.",
  3: "Only the token admin can do that.",
  4: "Amount must be greater than zero.",
  5: "You don't have enough LUMR for that.",
  6: "You can't transfer LUMR to yourself.",
};

const CONTRACT_ERROR_CODES: Record<number, DappErrorCode> = {
  5: "INSUFFICIENT_BALANCE",
};

/** Normalizes any raw wallet / RPC / simulation error into a typed DappError. */
export function mapError(err: unknown): DappError {
  if (err instanceof DappError) return err;

  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : JSON.stringify(err ?? "unknown error");

  // Soroban contract errors surface as `Error(Contract, #N)` in simulation
  // error strings.
  const contractMatch = raw.match(/Error\(Contract, #(\d+)\)/);
  if (contractMatch) {
    const code = Number(contractMatch[1]);
    return new DappError(
      CONTRACT_ERROR_CODES[code] ?? "SIMULATION_FAILED",
      CONTRACT_ERROR_MESSAGES[code] ?? `The contract rejected the call (error #${code}).`
    );
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes("user declined") ||
    lower.includes("user rejected") ||
    lower.includes("rejected by user") ||
    lower.includes("request was rejected") ||
    lower.includes("denied") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  ) {
    return new DappError("USER_REJECTED", "You rejected the request in your wallet.");
  }

  if (
    lower.includes("wallet is not installed") ||
    lower.includes("is not installed") ||
    lower.includes("wallet not found") ||
    lower.includes("no wallet") ||
    lower.includes("not available")
  ) {
    return new DappError(
      "WALLET_NOT_FOUND",
      "Wallet not found. Is the extension installed and unlocked?"
    );
  }

  if (lower.includes("network") && (lower.includes("mismatch") || lower.includes("wrong"))) {
    return new DappError(
      "NETWORK_MISMATCH",
      "Your wallet is on the wrong network. Switch it to Stellar testnet."
    );
  }

  if (lower.includes("underfunded") || lower.includes("insufficient")) {
    return new DappError(
      "INSUFFICIENT_BALANCE",
      "Insufficient balance. Make sure your account is funded on testnet."
    );
  }

  if (lower.includes("simulat") || lower.includes("hosterror") || lower.includes("host error")) {
    return new DappError(
      "SIMULATION_FAILED",
      "The transaction simulation failed. Please check your inputs and try again."
    );
  }

  return new DappError("UNKNOWN", "Something went wrong. Please try again.");
}
