"use client";

import { Flame, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useBurn } from "@/hooks/use-lumenranks";
import { TOKEN_SYMBOL } from "@/lib/stellar/config";
import { parseTokenAmount } from "@/lib/utils";

export function BurnForm() {
  const { burn, isPending } = useBurn();
  const [amount, setAmount] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    burn(rawAmount);
    setAmount("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-destructive" />
          Burn
        </CardTitle>
        <CardDescription>
          Permanently destroy {TOKEN_SYMBOL} from your balance. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="burn-amount">Amount ({TOKEN_SYMBOL})</Label>
            <Input
              id="burn-amount"
              placeholder="0.0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" variant="destructive" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Burning…
              </>
            ) : (
              <>
                <Flame />
                Burn {TOKEN_SYMBOL}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
