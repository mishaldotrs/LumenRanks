"use client";

import { useCallback, useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { NETWORK_PASSPHRASE } from "@/lib/stellar/config";
import { useWalletStore } from "@/lib/store/wallet-store";
import { getKit } from "@/lib/wallet/kit";
import { DappError, mapError } from "@/types/wallet";

/**
 * Avoids hydration mismatches for UI that depends on persisted wallet state:
 * the server always renders the "disconnected" variant.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export function useWallet() {
  const address = useWalletStore((s) => s.address);
  const walletId = useWalletStore((s) => s.walletId);
  const setWallet = useWalletStore((s) => s.setWallet);
  const clearWallet = useWalletStore((s) => s.clearWallet);

  const connect = useCallback(async () => {
    try {
      const kit = await getKit();
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id);
            const { address: selected } = await kit.getAddress();
            setWallet(selected, option.id);
            toast({
              title: "Wallet connected",
              description: `${selected.slice(0, 4)}…${selected.slice(-4)} is ready to go.`,
            });
          } catch (err) {
            const mapped = mapError(err);
            toast({
              variant: "destructive",
              title: "Connection failed",
              description: mapped.message,
            });
          }
        },
      });
    } catch (err) {
      const mapped = mapError(err);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: mapped.message,
      });
    }
  }, [setWallet]);

  const disconnect = useCallback(() => {
    clearWallet();
    getKit()
      .then((kit) => kit.disconnect())
      .catch(() => {
        // The kit may not have an active wallet — nothing to clean up.
      });
  }, [clearWallet]);

  const signTransaction = useCallback(
    async (xdrString: string): Promise<string> => {
      if (!address) {
        throw new DappError("WALLET_NOT_FOUND", "Connect your wallet first.");
      }
      try {
        const kit = await getKit();
        if (walletId) {
          kit.setWallet(walletId);
        }
        const { signedTxXdr } = await kit.signTransaction(xdrString, {
          networkPassphrase: NETWORK_PASSPHRASE,
          address,
        });
        return signedTxXdr;
      } catch (err) {
        throw mapError(err);
      }
    },
    [address, walletId]
  );

  return {
    address,
    walletId,
    isConnected: Boolean(address),
    connect,
    disconnect,
    signTransaction,
  };
}
