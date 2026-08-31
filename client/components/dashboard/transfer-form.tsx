"use client";

import { StrKey } from "@stellar/stellar-sdk";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useTransfer } from "@/hooks/use-lumenranks";
import { useWallet } from "@/hooks/use-wallet";
import { TOKEN_SYMBOL } from "@/lib/stellar/config";
import { parseTokenAmount } from "@/lib/utils";

export function TransferForm() {
  const { address } = useWallet();
  const { transfer, isPending } = useTransfer();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const to = recipient.trim();
    if (!StrKey.isValidEd25519PublicKey(to)) {
      toast({
        variant: "destructive",
        title: "Invalid recipient",
        description: "Enter a valid Stellar public key (G…, 56 characters).",
      });
      return;
    }
    if (to === address) {
      toast({
        variant: "destructive",
        title: "Invalid recipient",
        description: `You can't transfer ${TOKEN_SYMBOL} to yourself.`,
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

    transfer(to, rawAmount);
    setRecipient("");
    setAmount("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-5 w-5 text-primary" />
          Transfer
        </CardTitle>
        <CardDescription>Send {TOKEN_SYMBOL} to another Stellar account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-recipient">Recipient</Label>
            <Input
              id="transfer-recipient"
              placeholder="G…"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount ({TOKEN_SYMBOL})</Label>
            <Input
              id="transfer-amount"
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
                Sending…
              </>
            ) : (
              <>
                <Send />
                Transfer {TOKEN_SYMBOL}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
