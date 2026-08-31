"use client";

import { Copy, ExternalLink, Medal, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useHasMounted, useWallet } from "@/hooks/use-wallet";
import { accountExplorerUrl, TOKEN_SYMBOL } from "@/lib/stellar/config";
import { cn, formatAddress, formatTokenAmount, sharePercent } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/contract";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[] | undefined;
  totalSupply: bigint | undefined;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
}

const MEDAL_CLASSES = ["text-yellow-400", "text-zinc-300", "text-amber-600"] as const;

function copyToClipboard(address: string) {
  navigator.clipboard
    .writeText(address)
    .then(() => toast({ title: "Address copied", description: formatAddress(address, 8) }))
    .catch(() => toast({ variant: "destructive", title: "Couldn't copy the address" }));
}

export function LeaderboardTable({
  entries,
  totalSupply,
  isLoading,
  isError,
  errorMessage,
}: LeaderboardTableProps) {
  const mounted = useHasMounted();
  const { address } = useWallet();
  const connectedAddress = mounted ? address : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          All Holders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {errorMessage ?? "Couldn't load the leaderboard. Retrying…"}
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No holders yet</p>
            <p className="text-sm text-muted-foreground">
              Mint the first {TOKEN_SYMBOL} to claim the top spot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Rank</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                  <th className="px-3 py-2 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  const isYou = connectedAddress === entry.address;
                  const share =
                    totalSupply !== undefined ? sharePercent(entry.balance, totalSupply) : 0;
                  return (
                    <tr
                      key={entry.address}
                      className={cn(
                        "border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/40",
                        isYou && "bg-primary/10 hover:bg-primary/15"
                      )}
                    >
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1.5 font-semibold">
                          {rank <= 3 ? (
                            <Medal className={cn("h-4 w-4", MEDAL_CLASSES[rank - 1])} />
                          ) : null}
                          #{rank}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono">{formatAddress(entry.address, 6)}</span>
                          {isYou ? <Badge className="text-[10px]">You</Badge> : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            aria-label="Copy address"
                            onClick={() => copyToClipboard(entry.address)}
                          >
                            <Copy className="!size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            asChild
                            aria-label="View on stellar.expert"
                          >
                            <a
                              href={accountExplorerUrl(entry.address)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="!size-3" />
                            </a>
                          </Button>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">
                        {formatTokenAmount(entry.balance)}{" "}
                        <span className="text-xs text-muted-foreground">{TOKEN_SYMBOL}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-[140px] items-center gap-2">
                          <Progress value={share} className="h-2 flex-1" />
                          <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
                            {share.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
