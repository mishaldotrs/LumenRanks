"use client";

import { Wallet } from "lucide-react";

import { BurnForm } from "@/components/dashboard/burn-form";
import { MintForm } from "@/components/dashboard/mint-form";
import { MyStats } from "@/components/dashboard/my-stats";
import { TransferForm } from "@/components/dashboard/transfer-form";
import { ConnectButton } from "@/components/wallet/connect-button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/hooks/use-lumenranks";
import { useHasMounted, useWallet } from "@/hooks/use-wallet";
import { isContractConfigured } from "@/lib/contract/client";

export default function DashboardPage() {
  const mounted = useHasMounted();
  const { address, isConnected } = useWallet();
  const admin = useAdmin();
  const configured = isContractConfigured();

  const isAdmin = Boolean(mounted && address && admin.data && admin.data === address);

  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Your LUMR position and actions — transfer, burn{isAdmin ? ", and mint" : ""}.
        </p>
      </div>

      {!mounted ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !configured ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="font-medium text-foreground">Contract not configured</p>
          <p className="mt-1 text-sm">
            Deploy the LumenRanks contract (bun run contract:deploy) or set
            NEXT_PUBLIC_CONTRACT_ID first.
          </p>
        </div>
      ) : !isConnected ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Wallet className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-semibold">Connect your wallet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect a Stellar wallet (testnet) to see your rank, balance, and manage your
                LUMR.
              </p>
            </div>
            <ConnectButton />
          </CardContent>
        </Card>
      ) : (
        <>
          <MyStats />
          <div className="grid gap-4 lg:grid-cols-2">
            <TransferForm />
            <BurnForm />
            {isAdmin ? <MintForm /> : null}
          </div>
        </>
      )}
    </div>
  );
}
