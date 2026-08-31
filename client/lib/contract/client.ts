import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

import contractIds from "@/lib/contract/contract-ids.json";
import { NETWORK_PASSPHRASE } from "@/lib/stellar/config";
import { getServer } from "@/lib/stellar/rpc";
import type { LeaderboardEntry, TokenMeta } from "@/types/contract";
import { DappError, mapError } from "@/types/wallet";

/** Dummy funded-account-shaped source used purely for read simulations. */
const SIMULATION_SOURCE = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 30_000;

export function getContractId(): string {
  const id = process.env.NEXT_PUBLIC_CONTRACT_ID || contractIds.testnet;
  if (!id) {
    throw new DappError(
      "CONTRACT_NOT_CONFIGURED",
      "The LumenRanks contract hasn't been deployed/configured yet. Set NEXT_PUBLIC_CONTRACT_ID or run the deploy script."
    );
  }
  return id;
}

export function isContractConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CONTRACT_ID || contractIds.testnet);
}

/** Read-only contract call via transaction simulation. No wallet required. */
export async function readContract<T>(method: string, args: xdr.ScVal[] = []): Promise<T> {
  const server = getServer();
  const contract = new Contract(getContractId());
  const source = new Account(SIMULATION_SOURCE, "0");

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    const message = "error" in sim ? String(sim.error) : "Simulation failed";
    throw mapError(new Error(message));
  }
  if (!sim.result) {
    throw new DappError("SIMULATION_FAILED", "Simulation returned no result.");
  }
  return scValToNative(sim.result.retval) as T;
}

export interface InvokeResult {
  hash: string;
  response: rpc.Api.GetSuccessfulTransactionResponse;
}

export interface InvokeOptions {
  method: string;
  args: xdr.ScVal[];
  publicKey: string;
  /** Signs a base64 tx XDR and returns the signed base64 XDR. */
  sign: (xdrString: string) => Promise<string>;
  /** Called as soon as the tx has been accepted by the RPC (hash known). */
  onSubmitted?: (hash: string) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Full write flow: build → simulate/prepare → sign (wallet) → send → poll
 * until the transaction is final or times out (~30s).
 */
export async function invokeContract({
  method,
  args,
  publicKey,
  sign,
  onSubmitted,
}: InvokeOptions): Promise<InvokeResult> {
  const server = getServer();
  const contract = new Contract(getContractId());

  const account = await server.getAccount(publicKey).catch((err: unknown) => {
    throw mapError(
      err instanceof Error && err.message.toLowerCase().includes("not found")
        ? new Error("Account not found. Fund your testnet account (friendbot) first.")
        : err
    );
  });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  let prepared;
  try {
    prepared = await server.prepareTransaction(tx);
  } catch (err) {
    throw mapError(err);
  }

  const signedXdr = await sign(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const sendResponse = await server.sendTransaction(signedTx);
  if (sendResponse.status === "ERROR") {
    throw mapError(
      new Error(
        `Transaction submission failed: ${sendResponse.errorResult?.toXDR("base64") ?? "unknown error"}`
      )
    );
  }

  const hash = sendResponse.hash;
  onSubmitted?.(hash);

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const result = await server.getTransaction(hash);
    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return { hash, response: result };
    }
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new DappError("SIMULATION_FAILED", "The transaction failed on-chain.");
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new DappError(
    "UNKNOWN",
    "Timed out waiting for confirmation. Check the explorer for the final status."
  );
}

// ---------------------------------------------------------------------------
// Arg encoding helpers
// ---------------------------------------------------------------------------

export function addressToScVal(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function i128ToScVal(amount: bigint): xdr.ScVal {
  return nativeToScVal(amount, { type: "i128" });
}

export function u32ToScVal(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

// ---------------------------------------------------------------------------
// Typed read API
// ---------------------------------------------------------------------------

export const lumenranks = {
  balance: (id: string) => readContract<bigint>("balance", [addressToScVal(id)]),
  totalSupply: () => readContract<bigint>("total_supply"),
  holderCount: () => readContract<number>("holder_count"),
  getMeta: () => readContract<TokenMeta>("get_meta"),
  getAdmin: () => readContract<string>("get_admin"),
  /** limit 0 = all holders, sorted by balance descending. */
  getLeaderboard: (limit = 0) =>
    readContract<LeaderboardEntry[]>("get_leaderboard", [u32ToScVal(limit)]),
  /** 1-based rank; 0 = not a holder. */
  getRank: (id: string) => readContract<number>("get_rank", [addressToScVal(id)]),
};
