"use client";

import { useState, useEffect } from "react";
import { api, type PipelineStage as ApiPipelineStage } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, DollarSign, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  expected_close?: string;
}

export function PipelineBoard() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.opportunities.pipeline()
      .then((apiStages: ApiPipelineStage[]) => {
        // Transform API response to match component's expected shape
        const transformedStages: PipelineStage[] = apiStages.map(apiStage => ({
          stage: apiStage.stage,
          count: apiStage.count,
          value: apiStage.totalValue,
          expected_close: undefined // API doesn't provide this
        }));
        setStages(transformedStages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading pipeline...</div>;
  }

  const totalValue = stages.reduce((sum, s) => sum + (s.value || 0), 0);
  const totalCount = stages.reduce((sum, s) => sum + (s.count || 0), 0);

  const stageOrder = ["prospect", "contacted", "qualified", "proposal", "won", "lost"];
  const sorted = [...stages].sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Pipeline Value</div>
          <div className="text-2xl font-bold flex items-center gap-1">
            <DollarSign className="h-5 w-5 text-green-600" />
            {formatNumber(totalValue)}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Opps</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Avg Deal Size</div>
          <div className="text-2xl font-bold">{formatNumber(totalCount > 0 ? totalValue / totalCount : 0)}</div>
        </Card>
      </div>

      {/* Pipeline stages horizontal flow */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {sorted.map((stage, idx) => (
            <div key={stage.stage} className="flex items-center gap-2">
              <div className="min-w-[220px]">
                <Card className="p-4 bg-muted/40 border-dashed">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center justify-between">
                    <span className="capitalize">{stage.stage}</span>
                    <Badge variant="secondary" className="text-xs">{stage.count}</Badge>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${formatNumber(stage.value || 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2">
                    {stage.count > 0 ? `Avg: $${formatNumber((stage.value || 0) / stage.count)}` : "No deals"}
                  </div>
                </Card>
              </div>
              {idx < sorted.length - 1 && (
                <div className="flex items-center h-12">
                  <ArrowRight className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
