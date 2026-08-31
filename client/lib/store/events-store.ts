import { create } from "zustand";

import type { TokenEvent } from "@/types/events";

const MAX_EVENTS = 200;

interface EventsState {
  events: TokenEvent[];
  /** Last ledger we have polled up to (inclusive). */
  lastLedger: number | null;
  addEvents: (incoming: TokenEvent[], latestLedger: number) => void;
}

export const useEventsStore = create<EventsState>()((set) => ({
  events: [],
  lastLedger: null,
  addEvents: (incoming, latestLedger) =>
    set((state) => {
      const byId = new Map<string, TokenEvent>();
      for (const event of [...state.events, ...incoming]) {
        byId.set(event.id, event);
      }
      const merged = Array.from(byId.values())
        .sort((a, b) => {
          if (b.ledger !== a.ledger) return b.ledger - a.ledger;
          return b.id.localeCompare(a.id);
        })
        .slice(0, MAX_EVENTS);
      return {
        events: merged,
        lastLedger: Math.max(latestLedger, state.lastLedger ?? 0),
      };
    }),
}));
