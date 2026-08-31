/** Mirrors the on-chain `TokenMeta` struct. */
export interface TokenMeta {
  name: string;
  symbol: string;
  decimals: number;
}

/** One entry of `get_leaderboard` — sorted by balance, descending. */
export interface LeaderboardEntry {
  address: string;
  balance: bigint;
}

/** Contract error codes (`Error(Contract, #N)`). */
export enum ContractErrorCode {
  AlreadyInitialized = 1,
  NotInitialized = 2,
  NotAdmin = 3,
  InvalidAmount = 4,
  InsufficientBalance = 5,
  SelfTransfer = 6,
}
