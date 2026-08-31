"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import {
  addressToScVal,
  i128ToScVal,
  invokeContract,
  isContractConfigured,
  lumenranks,
} from "@/lib/contract/client";
import { TOKEN_SYMBOL } from "@/lib/stellar/config";
import { useTxStore } from "@/lib/store/tx-store";
import { formatAddress, formatTokenAmount } from "@/lib/utils";
import { DappError, mapError } from "@/types/wallet";

const REFETCH_INTERVAL = 5000;

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function useTokenMeta() {
  return useQuery({
    queryKey: ["lumenranks", "meta"],
    queryFn: () => lumenranks.getMeta(),
    enabled: isContractConfigured(),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useTotalSupply() {
  return useQuery({
    queryKey: ["lumenranks", "totalSupply"],
    queryFn: () => lumenranks.totalSupply(),
    enabled: isContractConfigured(),
    refetchInterval: REFETCH_INTERVAL,
    retry: 1,
  });
}

export function useHolderCount() {
  return useQuery({
    queryKey: ["lumenranks", "holderCount"],
    queryFn: () => lumenranks.holderCount(),
    enabled: isContractConfigured(),
    refetchInterval: REFETCH_INTERVAL,
    retry: 1,
  });
}

export function useLeaderboard(limit = 0) {
  return useQuery({
    queryKey: ["lumenranks", "leaderboard", limit],
    queryFn: () => lumenranks.getLeaderboard(limit),
    enabled: isContractConfigured(),
    refetchInterval: REFETCH_INTERVAL,
    retry: 1,
  });
}

export function useAdmin() {
  return useQuery({
    queryKey: ["lumenranks", "admin"],
    queryFn: () => lumenranks.getAdmin(),
    enabled: isContractConfigured(),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useBalance(address: string | null | undefined) {
  return useQuery({
    queryKey: ["lumenranks", "balance", address],
    queryFn: () => lumenranks.balance(address as string),
    enabled: Boolean(address) && isContractConfigured(),
    refetchInterval: REFETCH_INTERVAL,
    retry: 1,
  });
}

export function useRank(address: string | null | undefined) {
  return useQuery({
    queryKey: ["lumenranks", "rank", address],
    queryFn: () => lumenranks.getRank(address as string),
    enabled: Boolean(address) && isContractConfigured(),
    refetchInterval: REFETCH_INTERVAL,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

type WriteMethod = "transfer" | "mint" | "burn";

interface WriteVariables {
  method: WriteMethod;
  args: Parameters<typeof invokeContract>[0]["args"];
  summary: string;
}

function useContractWrite() {
  const { address, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ method, args, summary }: WriteVariables) => {
      if (!address) {
        throw new DappError("WALLET_NOT_FOUND", "Connect your wallet first.");
      }
      let submittedHash: string | null = null;
      try {
        const { hash } = await invokeContract({
          method,
          args,
          publicKey: address,
          sign: signTransaction,
          onSubmitted: (hash) => {
            submittedHash = hash;
            useTxStore.getState().addTx({
              hash,
              method,
              summary,
              status: "pending",
              createdAt: Date.now(),
            });
          },
        });
        useTxStore.getState().updateTx(hash, "success");
        return hash;
      } catch (err) {
        if (submittedHash) {
          useTxStore.getState().updateTx(submittedHash, "failed");
        }
        throw mapError(err);
      }
    },
    onSuccess: (_hash, variables) => {
      toast({ title: "Transaction confirmed", description: variables.summary });
      void queryClient.invalidateQueries({ queryKey: ["lumenranks"] });
    },
    onError: (err) => {
      const mapped = mapError(err);
      toast({
        variant: "destructive",
        title: "Transaction failed",
        description: mapped.message,
      });
    },
  });
}

export function useTransfer() {
  const { address } = useWallet();
  const mutation = useContractWrite();

  const transfer = (to: string, amount: bigint) => {
    if (!address) return;
    mutation.mutate({
      method: "transfer",
      args: [addressToScVal(address), addressToScVal(to), i128ToScVal(amount)],
      summary: `Transfer ${formatTokenAmount(amount)} ${TOKEN_SYMBOL} to ${formatAddress(to)}`,
    });
  };

  return { ...mutation, transfer };
}

export function useMint() {
  const { address } = useWallet();
  const mutation = useContractWrite();

  const mint = (to: string, amount: bigint) => {
    if (!address) return;
    mutation.mutate({
      method: "mint",
      args: [addressToScVal(address), addressToScVal(to), i128ToScVal(amount)],
      summary: `Mint ${formatTokenAmount(amount)} ${TOKEN_SYMBOL} to ${formatAddress(to)}`,
    });
  };

  return { ...mutation, mint };
}

export function useBurn() {
  const { address } = useWallet();
  const mutation = useContractWrite();

  const burn = (amount: bigint) => {
    if (!address) return;
    mutation.mutate({
      method: "burn",
      args: [addressToScVal(address), i128ToScVal(amount)],
      summary: `Burn ${formatTokenAmount(amount)} ${TOKEN_SYMBOL}`,
    });
  };

  return { ...mutation, burn };
}
