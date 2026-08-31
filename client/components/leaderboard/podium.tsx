"use client";

import { Crown, Medal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TOKEN_SYMBOL } from "@/lib/stellar/config";
import { cn, formatAddress, formatTokenAmount } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/contract";

interface PodiumProps {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

const PODIUM_STYLES = [
  {
    label: "1st",
    ring: "border-yellow-500/60",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    height: "md:pt-0",
  },
  {
    label: "2nd",
    ring: "border-zinc-400/50",
    text: "text-zinc-300",
    bg: "bg-zinc-400/10",
    height: "md:pt-8",
  },
  {
    label: "3rd",
    ring: "border-amber-700/60",
    text: "text-amber-600",
    bg: "bg-amber-700/10",
    height: "md:pt-12",
  },
] as const;

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: 0 | 1 | 2 }) {
  const style = PODIUM_STYLES[place];
  return (
    <div className={cn("flex-1", style.height)}>
      <Card className={cn("border-2", style.ring)}>
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              style.bg,
              style.text
            )}
          >
            {place === 0 ? <Crown className="h-6 w-6" /> : <Medal className="h-6 w-6" />}
          </span>
          <span className={cn("text-sm font-bold uppercase tracking-widest", style.text)}>
            {style.label}
          </span>
          <span className="font-mono text-sm">{formatAddress(entry.address, 6)}</span>
          <span className="text-lg font-bold">
            {formatTokenAmount(entry.balance)}{" "}
            <span className="text-sm font-normal text-muted-foreground">{TOKEN_SYMBOL}</span>
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export function Podium({ entries, isLoading }: PodiumProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 md:flex-row">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48 flex-1" />
        ))}
      </div>
    );
  }

  const top3 = entries?.slice(0, 3) ?? [];
  if (top3.length === 0) return null;

  // Display order: 2nd, 1st, 3rd (classic podium) on desktop.
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      {second ? <PodiumCard entry={second} place={1} /> : <div className="hidden flex-1 md:block" />}
      <PodiumCard entry={first} place={0} />
      {third ? <PodiumCard entry={third} place={2} /> : <div className="hidden flex-1 md:block" />}
    </div>
  );
}
