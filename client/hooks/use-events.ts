"use client";

import { rpc, scValToNative } from "@stellar/stellar-sdk";
import { useQuery } from "@tanstack/react-query";

import { getContractId, isContractConfigured } from "@/lib/contract/client";
import { getServer } from "@/lib/stellar/rpc";
import { useEventsStore } from "@/lib/store/events-store";
import type { TokenEvent } from "@/types/events";

const POLL_INTERVAL = 5000;
/** How far back to look on the very first poll. */
const INITIAL_LOOKBACK_LEDGERS = 2000;

function decodeEvent(event: rpc.Api.EventResponse): TokenEvent | null {
  try {
    const topics = event.topic.map((t) => scValToNative(t) as unknown);
    const kind = topics[0];
    const amount = scValToNative(event.value) as bigint;
    const base = {
      id: event.id,
      amount,
      ledger: event.ledger,
      txHash: event.txHash,
      timestamp: new Date(event.ledgerClosedAt).getTime(),
    };

    if (kind === "mint") {
      return { ...base, type: "mint", to: String(topics[1]) };
    }
    if (kind === "transfer") {
      return { ...base, type: "transfer", from: String(topics[1]), to: String(topics[2]) };
    }
    if (kind === "burn") {
      return { ...base, type: "burn", from: String(topics[1]) };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Polls Soroban RPC `getEvents` for the LumenRanks contract every 5s,
 * decodes mint/transfer/burn events, and merges them (deduped, newest
 * first) into the zustand events store.
 */
export function useEvents() {
  const events = useEventsStore((s) => s.events);
  const configured = isContractConfigured();

  const query = useQuery({
    queryKey: ["lumenranks", "events"],
    queryFn: async () => {
      const server = getServer();
      const contractId = getContractId();
      const store = useEventsStore.getState();

      let startLedger = store.lastLedger;
      if (!startLedger) {
        const latest = await server.getLatestLedger();
        startLedger = Math.max(latest.sequence - INITIAL_LOOKBACK_LEDGERS, 1);
      }

      const response = await server.getEvents({
        startLedger,
        filters: [{ type: "contract", contractIds: [contractId] }],
        limit: 100,
      });

      const decoded = response.events
        .map(decodeEvent)
        .filter((e): e is TokenEvent => e !== null);

      store.addEvents(decoded, response.latestLedger);
      return decoded.length;
    },
    enabled: configured,
    refetchInterval: POLL_INTERVAL,
    retry: false,
  });

  return {
    events,
    isLoading: query.isLoading && events.length === 0,
    isError: query.isError,
    error: query.error,
    configured,
  };
}
