"use client";

import { useEffect, useState } from "react";
import { api, Opportunity } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "discovery", label: "Discovery", color: "bg-blue-500/10 text-blue-500" },
  { id: "proposal", label: "Proposal", color: "bg-purple-500/10 text-purple-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500/10 text-orange-500" },
  { id: "won", label: "Won", color: "bg-green-500/10 text-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500/10 text-red-500" },
] as const;

export function KanbanBoard({ refreshKey }: { refreshKey?: number }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.opportunities.list().then(setOpportunities).finally(() => setLoading(false));
  }, [refreshKey]);

  const getCardsByStage = (stageId: string) => {
    return opportunities.filter((o) => o.stage === stageId);
  };

  if (loading) return <div className="p-8">Loading pipeline...</div>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {STAGES.map((stage) => (
        <div key={stage.id} className="flex-1 min-w-[300px] flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                {stage.label}
              </h3>
              <Badge variant="secondary" className="rounded-full">
                {getCardsByStage(stage.id).length}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 bg-muted/30 rounded-lg p-3 flex flex-col gap-3 min-h-[500px]">
            {getCardsByStage(stage.id).map((opp) => (
              <Card key={opp.id} className="shadow-sm hover:ring-1 hover:ring-primary/20 transition-all cursor-grab active:cursor-grabbing">
                <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-start justify-between">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {opp.title}
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                    <DotsVerticalIcon className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {opp.description || "No description provided."}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm font-bold">
                      {opp.currency || "$"} {Number(opp.value || 0).toLocaleString()}
                    </div>
                    {opp.probability && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                        {opp.probability}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
