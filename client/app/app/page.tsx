"use client";

import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Podium } from "@/components/leaderboard/podium";
import { StatsCards } from "@/components/leaderboard/stats-cards";
import { useLeaderboard, useTotalSupply } from "@/hooks/use-lumenranks";
import { isContractConfigured } from "@/lib/contract/client";
import { mapError } from "@/types/wallet";

export default function LeaderboardPage() {
  const configured = isContractConfigured();
  const leaderboard = useLeaderboard(0);
  const supply = useTotalSupply();

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">
          Every LUMR holder, ranked live on-chain. Auto-refreshes every 5 seconds.
        </p>
      </div>

      {!configured ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="font-medium text-foreground">Contract not configured</p>
          <p className="mt-1 text-sm">
            Deploy the LumenRanks contract (bun run contract:deploy) or set
            NEXT_PUBLIC_CONTRACT_ID to load the leaderboard.
          </p>
        </div>
      ) : (
        <>
          <StatsCards />
          <Podium entries={leaderboard.data} isLoading={leaderboard.isLoading} />
          <LeaderboardTable
            entries={leaderboard.data}
            totalSupply={supply.data}
            isLoading={leaderboard.isLoading}
            isError={leaderboard.isError}
            errorMessage={leaderboard.error ? mapError(leaderboard.error).message : undefined}
          />
        </>
      )}
    </div>
  );
}
