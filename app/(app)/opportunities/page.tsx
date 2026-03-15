"use client";

import { useEffect, useState } from "react";
import { api, Opportunity, Lead } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, DollarSign, Calendar, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "discovery", label: "Discovery", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { id: "proposal", label: "Proposal", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { id: "won", label: "Closed Won", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  { id: "lost", label: "Closed Lost", color: "bg-red-500/10 text-red-500 border-red-500/20" },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.opportunities.list().then((res) => {
      // Handle both array response and { data: [...] } wrapper
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setOpportunities(data);
    }).finally(() => setLoading(false));
  }, []);

  const getStageOpps = (stageId: string) => opportunities.filter(o => o.stage === stageId);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 bg-background/50 p-3 md:p-4 rounded-xl border backdrop-blur-sm shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground text-sm">Manage your high-value deals and sales pipeline.</p>
        </div>
        <Button size="sm" className="md:size-default gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> New Opportunity
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-4 md:gap-6 h-full min-w-max">
          {STAGES.map((stage) => (
            <div key={stage.id} className="w-72 md:w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("px-2 py-0.5 font-bold uppercase tracking-wider text-[10px]", stage.color)}>
                    {stage.label}
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground/50">{getStageOpps(stage.id).length}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20 p-3 space-y-3 overflow-y-auto scrollbar-hide">
                {getStageOpps(stage.id).map((opp) => (
                  <Card key={opp.id} className="group cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md shadow-black/5 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{opp.title}</h4>
                        <Badge variant="secondary" className="text-[10px] font-mono bg-background/50">{opp.probability || 0}%</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <DollarSign className="h-3 w-3 text-green-500/70" />
                          <span className="text-foreground/80">{opp.value || "0.00"} {opp.currency || "USD"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <Calendar className="h-3 w-3 text-blue-500/70" />
                          <span className="truncate">{opp.expected_closed_at ? new Date(opp.expected_closed_at).toLocaleDateString() : "No date"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground">{opp.assigned_to ? "Assigned" : "Unassigned"}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getStageOpps(stage.id).length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest text-center px-4">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
