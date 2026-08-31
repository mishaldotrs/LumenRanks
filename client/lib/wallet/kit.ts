import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

// The wallets kit registers custom elements at import time, so it must only
// ever be loaded in the browser. We lazy-load it via dynamic import and keep
// a singleton instance.
let kitPromise: Promise<StellarWalletsKit> | null = null;

export function getKit(): Promise<StellarWalletsKit> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("StellarWalletsKit is only available in the browser."));
  }
  if (!kitPromise) {
    kitPromise = import("@creit.tech/stellar-wallets-kit").then(
      ({ StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID }) =>
        new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          selectedWalletId: FREIGHTER_ID,
          modules: allowAllModules(),
        })
    );
  }
  return kitPromise;
}
