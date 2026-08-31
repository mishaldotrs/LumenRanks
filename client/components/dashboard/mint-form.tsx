"use client";

import { StrKey } from "@stellar/stellar-sdk";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMint } from "@/hooks/use-lumenranks";
import { useWallet } from "@/hooks/use-wallet";
import { TOKEN_SYMBOL } from "@/lib/stellar/config";
import { parseTokenAmount } from "@/lib/utils";

/**
 * Admin-only mint form. Only render this when the connected wallet address
 * equals the contract's `get_admin()` result.
 */
export function MintForm() {
  const { address } = useWallet();
  const { mint, isPending } = useMint();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const to = recipient.trim() || address || "";
    if (!StrKey.isValidEd25519PublicKey(to)) {
      toast({
        variant: "destructive",
        title: "Invalid recipient",
        description: "Enter a valid Stellar public key (G…, 56 characters).",
      });
      return;
    }

    let rawAmount: bigint;
    try {
      rawAmount = parseTokenAmount(amount);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: err instanceof Error ? err.message : "Enter a valid amount.",
      });
      return;
    }
    if (rawAmount <= BigInt(0)) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Amount must be greater than zero.",
      });
      return;
    }

    mint(to, rawAmount);
    setRecipient("");
    setAmount("");
  };

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Mint
          <Badge variant="outline" className="ml-1 border-primary/50 text-primary">
            Admin
          </Badge>
        </CardTitle>
        <CardDescription>
          Mint new {TOKEN_SYMBOL} to any account. Leave the recipient empty to mint to yourself.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mint-recipient">Recipient (optional)</Label>
            <Input
              id="mint-recipient"
              placeholder={address ?? "G…"}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mint-amount">Amount ({TOKEN_SYMBOL})</Label>
            <Input
              id="mint-amount"
              placeholder="0.0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Minting…
              </>
            ) : (
              <>
                <Sparkles />
                Mint {TOKEN_SYMBOL}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
