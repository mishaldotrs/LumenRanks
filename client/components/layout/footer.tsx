import Link from "next/link";
import { Github, Trophy } from "lucide-react";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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
          <span aria-hidden="true" className="h-4 w-px bg-border" />
          <a
            href="https://github.com/mishaldotrs/LumenRanks"
            target="_blank"
            rel="noreferrer"
            aria-label="LumenRanks on GitHub"
            title="GitHub"
            className="hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://x.com/mishaldotrs"
            target="_blank"
            rel="noreferrer"
            aria-label="Developer on X"
            title="X (Twitter)"
            className="hover:text-foreground"
          >
            <XLogo className="h-4 w-4" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
