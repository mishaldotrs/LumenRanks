"use client";

import { Coins, PieChart, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalance, useRank, useTotalSupply } from "@/hooks/use-lumenranks";
import { useWallet } from "@/hooks/use-wallet";
import { TOKEN_SYMBOL } from "@/lib/stellar/config";
import { formatTokenAmount, sharePercent } from "@/lib/utils";

export function MyStats() {
  const { address } = useWallet();
  const balance = useBalance(address);
  const rank = useRank(address);
  const supply = useTotalSupply();

  const share =
    balance.data !== undefined && supply.data !== undefined
      ? sharePercent(balance.data, supply.data)
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">My Balance</CardTitle>
          <Coins className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {balance.isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold">
              {balance.data !== undefined ? formatTokenAmount(balance.data) : "—"}{" "}
              <span className="text-sm font-normal text-muted-foreground">{TOKEN_SYMBOL}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">My Rank</CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {rank.isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {rank.data === undefined ? "—" : rank.data === 0 ? "Not a holder" : `#${rank.data}`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Supply Share</CardTitle>
          <PieChart className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {share === null ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="text-2xl font-bold">{share.toFixed(2)}%</div>
              <Progress value={share} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
