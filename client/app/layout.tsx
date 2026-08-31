import type { Metadata } from "next";

import "./globals.css";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LumenRanks — Token Leaderboard on Stellar",
  description:
    "Track LUMR token holders in real-time on Stellar testnet. Live leaderboard, wallet dashboard, and on-chain activity feed powered by Soroban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
