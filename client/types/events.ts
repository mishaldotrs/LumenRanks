export type TokenEventType = "mint" | "transfer" | "burn";

/** A decoded contract event, ready for the UI. */
export interface TokenEvent {
  /** Unique event id from the RPC (used for dedupe). */
  id: string;
  type: TokenEventType;
  /** Present for transfer + burn. */
  from?: string;
  /** Present for mint + transfer. */
  to?: string;
  /** Raw i128 amount in stroop-like units (10^7 per LUMR). */
  amount: bigint;
  ledger: number;
  txHash: string;
  /** Unix millis of ledger close. */
  timestamp: number;
}
