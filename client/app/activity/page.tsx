"use client";

import { History, Radio } from "lucide-react";

import { EventFeed } from "@/components/activity/event-feed";
import { TxHistory } from "@/components/activity/tx-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ActivityPage() {
  return (
    <div className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-muted-foreground">
          Live on-chain LUMR events and your session transaction history.
        </p>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events" className="gap-1.5">
            <Radio className="h-4 w-4" />
            Live events
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5">
            <History className="h-4 w-4" />
            My transactions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-4">
          <EventFeed />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <TxHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
