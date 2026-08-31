import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WalletState {
  address: string | null;
  walletId: string | null;
  setWallet: (address: string, walletId: string) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      walletId: null,
      setWallet: (address, walletId) => set({ address, walletId }),
      clearWallet: () => set({ address: null, walletId: null }),
    }),
    {
      name: "lumenranks-wallet",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
