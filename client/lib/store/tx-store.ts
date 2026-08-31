import { create } from "zustand";

export type TxStatus = "pending" | "success" | "failed";

export interface TrackedTx {
  hash: string;
  method: "transfer" | "mint" | "burn";
  /** Human-readable summary, e.g. "Transfer 12.5 LUMR to GABC…XYZ". */
  summary: string;
  status: TxStatus;
  createdAt: number;
}

interface TxState {
  txs: TrackedTx[];
  addTx: (tx: TrackedTx) => void;
  updateTx: (hash: string, status: TxStatus) => void;
  clearTxs: () => void;
}

/** Session-only tracker for transactions submitted from this browser tab. */
export const useTxStore = create<TxState>()((set) => ({
  txs: [],
  addTx: (tx) => set((state) => ({ txs: [tx, ...state.txs] })),
  updateTx: (hash, status) =>
    set((state) => ({
      txs: state.txs.map((tx) => (tx.hash === hash ? { ...tx, status } : tx)),
    })),
  clearTxs: () => set({ txs: [] }),
}));
