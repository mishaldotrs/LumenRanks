import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Crown,
  Medal,
  Radio,
  ShieldCheck,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Trophy,
    title: "Live Leaderboard",
    description:
      "Every LUMR holder ranked in real-time, straight from the Soroban contract. Podium, medals, and supply share included.",
  },
  {
    icon: Radio,
    title: "On-chain Activity Feed",
    description:
      "Mints, transfers, and burns stream in as they land on-ledger — polled every 5 seconds via Soroban RPC events.",
  },
  {
    icon: Wallet,
    title: "Wallet Dashboard",
    description:
      "Connect Freighter (or any Stellar wallet) to see your rank, balance, and supply share — then transfer or burn in a click.",
  },
  {
    icon: Zap,
    title: "Fast & Cheap",
    description:
      "Built on Stellar testnet with Soroban smart contracts: sub-second finality and fees measured in fractions of a cent.",
  },
  {
    icon: ShieldCheck,
    title: "Fully On-chain",
    description:
      "Rankings aren't computed off-chain — the contract itself sorts holders and exposes get_leaderboard and get_rank.",
  },
  {
    icon: Activity,
    title: "Session Tx Tracker",
    description:
      "Every transaction you submit is tracked from pending to final, with direct links to stellar.expert.",
  },
] as const;

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(43_96%_56%/0.12),transparent_60%)]"
          aria-hidden
        />
        <div className="container relative flex flex-col items-center gap-6 py-24 text-center md:py-32">
          <div className="flex items-center gap-3 text-primary">
            <Medal className="h-8 w-8" />
            <Trophy className="h-12 w-12" />
            <Crown className="h-8 w-8" />
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Track token holders in <span className="text-primary">real-time</span> — only on
            Stellar
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            LumenRanks is a live leaderboard for the LUMR token, powered entirely by a Soroban
            smart contract on Stellar testnet. Climb the ranks. Claim the crown.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/app">
                <Trophy />
                View Leaderboard
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">
                <Wallet />
                Open Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything on-chain, live in your browser</h2>
          <p className="mt-2 text-muted-foreground">
            LUMR — 7 decimals, just like XLM stroops. One contract, zero indexers.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <Crown className="h-10 w-10 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Ready to take the top spot?
          </h2>
          <p className="max-w-md text-muted-foreground">
            Connect your wallet, grab some LUMR, and watch yourself climb the leaderboard in
            real-time.
          </p>
          <Button size="lg" asChild>
            <Link href="/app">
              View Leaderboard
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
