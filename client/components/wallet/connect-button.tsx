"use client";

import { Check, ChevronDown, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useHasMounted, useWallet } from "@/hooks/use-wallet";
import { accountExplorerUrl } from "@/lib/stellar/config";
import { formatAddress } from "@/lib/utils";

export function ConnectButton() {
  const mounted = useHasMounted();
  const { address, isConnected, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!mounted) {
    return <Skeleton className="h-10 w-36" />;
  }

  if (!isConnected || !address) {
    return (
      <Button onClick={() => void connect()}>
        <Wallet />
        Connect Wallet
      </Button>
    );
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({ title: "Address copied", description: formatAddress(address, 8) });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ variant: "destructive", title: "Couldn't copy the address" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          <span className="font-mono">{formatAddress(address)}</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">
          {formatAddress(address, 10)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void copyAddress()}>
          {copied ? <Check /> : <Copy />}
          Copy address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={accountExplorerUrl(address)} target="_blank" rel="noreferrer">
            <ExternalLink />
            View on stellar.expert
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="text-destructive focus:text-destructive"
        >
          <LogOut />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
