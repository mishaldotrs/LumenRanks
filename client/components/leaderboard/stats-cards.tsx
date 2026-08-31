"use client";

import { Coins, Crown, Trophy, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHolderCount, useLeaderboard, useRank, useTotalSupply } from "@/hooks/use-lumenranks";
import { useHasMounted, useWallet } from "@/hooks/use-wallet";
import { TOKEN_SYMBOL } from "@/lib/stellar/config";
import { formatAddress, formatTokenAmount } from "@/lib/utils";

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, icon, value, sub, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const mounted = useHasMounted();
  const { address, isConnected } = useWallet();

  const supply = useTotalSupply();
  const holders = useHolderCount();
  const leaderboard = useLeaderboard(0);
  const rank = useRank(mounted ? address : null);

  const topHolder = leaderboard.data?.[0];
  const showWallet = mounted && isConnected;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Supply"
        icon={<Coins className="h-4 w-4" />}
        loading={supply.isLoading}
        value={
          supply.data !== undefined ? `${formatTokenAmount(supply.data)} ${TOKEN_SYMBOL}` : "—"
        }
      />
      <StatCard
        title="Holders"
        icon={<Users className="h-4 w-4" />}
        loading={holders.isLoading}
        value={holders.data !== undefined ? holders.data.toLocaleString("en-US") : "—"}
      />
      <StatCard
        title="Top Holder"
        icon={<Crown className="h-4 w-4" />}
        loading={leaderboard.isLoading}
        value={topHolder ? <span className="font-mono">{formatAddress(topHolder.address)}</span> : "—"}
        sub={topHolder ? `${formatTokenAmount(topHolder.balance)} ${TOKEN_SYMBOL}` : undefined}
      />
      <StatCard
        title="Your Rank"
        icon={<Trophy className="h-4 w-4" />}
        loading={showWallet && rank.isLoading}
        value={
          !showWallet
            ? "—"
            : rank.data === undefined
              ? "—"
              : rank.data === 0
                ? "Not a holder"
                : `#${rank.data}`
        }
        sub={!showWallet ? "Connect your wallet" : undefined}
      />
    </div>
  );
}
