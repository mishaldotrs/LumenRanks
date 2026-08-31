"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowRight, ExternalLink, Flame, Radio, Send, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-events";
import { TOKEN_SYMBOL, txExplorerUrl } from "@/lib/stellar/config";
import { formatAddress, formatTokenAmount } from "@/lib/utils";
import type { TokenEvent } from "@/types/events";

function EventBadge({ type }: { type: TokenEvent["type"] }) {
  if (type === "mint") {
    return (
      <Badge className="gap-1">
        <Sparkles className="h-3 w-3" />
        Mint
      </Badge>
    );
  }
  if (type === "burn") {
    return (
      <Badge variant="destructive" className="gap-1">
        <Flame className="h-3 w-3" />
        Burn
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Send className="h-3 w-3" />
      Transfer
    </Badge>
  );
}

function EventRow({ event }: { event: TokenEvent }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/50 py-3 last:border-0">
      <EventBadge type={event.type} />
      <span className="flex items-center gap-1.5 font-mono text-sm">
        {event.from ? formatAddress(event.from) : null}
        {event.from && event.to ? (
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        ) : null}
        {event.to ? formatAddress(event.to) : null}
      </span>
      <span className="font-semibold tabular-nums">
        {formatTokenAmount(event.amount)}{" "}
        <span className="text-xs font-normal text-muted-foreground">{TOKEN_SYMBOL}</span>
      </span>
      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
        <Button variant="ghost" size="icon" className="h-6 w-6" asChild aria-label="View transaction">
          <a href={txExplorerUrl(event.txHash)} target="_blank" rel="noreferrer">
            <ExternalLink className="!size-3" />
          </a>
        </Button>
      </span>
    </div>
  );
}

export function EventFeed() {
  const { events, isLoading, configured } = useEvents();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Radio className="h-4 w-4 animate-pulse text-primary" />
          Polling contract events every 5 seconds
        </div>
        {!configured ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            The contract isn&apos;t configured yet — deploy it to start streaming events.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No events yet. Mint, transfer, or burn some {TOKEN_SYMBOL} to see them here live.
          </div>
        ) : (
          <div>
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
