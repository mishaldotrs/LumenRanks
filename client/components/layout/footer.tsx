import Link from "next/link";
import { Trophy } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span>
            LumenRanks — a real-time token-holder leaderboard on{" "}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Stellar
            </a>{" "}
            testnet.
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/app" className="hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/activity" className="hover:text-foreground">
            Activity
          </Link>
        </nav>
      </div>
    </footer>
  );
}
