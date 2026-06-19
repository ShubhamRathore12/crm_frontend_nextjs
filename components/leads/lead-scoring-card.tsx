"use client";

import { useEffect, useState } from "react";
import { api, type LeadScore as ApiLeadScore } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp, Zap } from "lucide-react";

interface LeadScore {
  total_score: number;
  engagement_score: number;
  profile_score: number;
  activity_score: number;
  recommendation: string;
}

export function LeadScoringCard({ leadId }: { leadId: string }) {
  const [score, setScore] = useState<LeadScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leads.score(leadId)
      .then((apiScore: ApiLeadScore) => {
        // Transform API response to match component's expected shape
        const transformedScore: LeadScore = {
          total_score: apiScore.score,
          engagement_score: apiScore.factors?.engagement || 0,
          profile_score: apiScore.factors?.profile || 0,
          activity_score: apiScore.factors?.activity || 0,
          recommendation: apiScore.score >= 80 ? "High Priority" : 
                         apiScore.score >= 60 ? "Medium Priority" : "Needs Attention"
        };
        setScore(transformedScore);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) return null;
  if (!score) return null;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-600 dark:text-green-400";
    if (s >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return "bg-green-500/15";
    if (s >= 60) return "bg-amber-500/15";
    return "bg-red-500/15";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Lead Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Score */}
        <div className={`p-3 rounded-lg ${getScoreBg(score.total_score)}`}>
          <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(score.total_score)}`}>
            {score.total_score}
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Engagement</span>
            <span className="font-semibold">{score.engagement_score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Profile</span>
            <span className="font-semibold">{score.profile_score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Activity</span>
            <span className="font-semibold">{score.activity_score}</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Recommendation
          </div>
          <p className="text-xs text-foreground">{score.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
