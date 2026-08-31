"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, ExternalLink, History, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHasMounted } from "@/hooks/use-wallet";
import { txExplorerUrl } from "@/lib/stellar/config";
import { useTxStore, type TxStatus } from "@/lib/store/tx-store";
import { formatAddress } from "@/lib/utils";

function StatusBadge({ status }: { status: TxStatus }) {
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Pending
      </Badge>
    );
  }
  if (status === "success") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
}

export function TxHistory() {
  const mounted = useHasMounted();
  const txs = useTxStore((s) => s.txs);

  return (
    <Card>
      <CardContent className="pt-6">
        {!mounted || txs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <History className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No transactions this session</p>
            <p className="text-sm text-muted-foreground">
              Transfers, mints, and burns you submit will show up here.
            </p>
          </div>
        ) : (
          <div>
            {txs.map((tx) => (
              <div
                key={tx.hash}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/50 py-3 last:border-0"
              >
                <StatusBadge status={tx.status} />
                <span className="text-sm">{tx.summary}</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-mono">{formatAddress(tx.hash, 6)}</span>
                  {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    asChild
                    aria-label="View transaction on stellar.expert"
                  >
                    <a href={txExplorerUrl(tx.hash)} target="_blank" rel="noreferrer">
                      <ExternalLink className="!size-3" />
                    </a>
                  </Button>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
