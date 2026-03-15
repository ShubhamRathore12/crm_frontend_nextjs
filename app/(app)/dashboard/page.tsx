"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  UserPlus,
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  MessageSquare,
  Target,
  Mail,
  CheckSquare,
  Megaphone,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.analytics.overview(),
  });

  const { data: overall } = useQuery({
    queryKey: ["analytics-overall"],
    queryFn: () => api.analytics.overall(),
  });

  const { data: leadStats } = useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => api.leads.stats(),
  });

  const { data: interactionStats } = useQuery({
    queryKey: ["interaction-stats"],
    queryFn: () => api.interactions.stats(),
  });

  const widgets = [
    {
      title: "Total Leads",
      value: overall?.leads ?? overview?.leads?.total ?? "—",
      subtitle: overview?.leads?.new_today ? `+${overview.leads.new_today} today` : undefined,
      icon: UserPlus,
      color: "text-blue-500",
    },
    {
      title: "Open Interactions",
      value: overview?.interactions?.open ?? overall?.interactions ?? "—",
      subtitle: overview?.interactions?.total ? `${overview.interactions.total} total` : undefined,
      icon: MessageSquare,
      color: "text-orange-500",
    },
    {
      title: "Opportunities",
      value: overall?.opportunities ?? overview?.opportunities?.total ?? "—",
      subtitle: overview?.opportunities?.total_value
        ? `$${(overview.opportunities.total_value / 1000).toFixed(0)}k value`
        : undefined,
      icon: Target,
      color: "text-green-500",
    },
    {
      title: "Tasks",
      value: overall?.tasks ?? overview?.tasks?.total ?? "—",
      subtitle: overview?.tasks?.overdue ? `${overview.tasks.overdue} overdue` : undefined,
      icon: CheckSquare,
      color: "text-purple-500",
    },
    {
      title: "Campaigns",
      value: overview?.campaigns?.total ?? "—",
      subtitle: overview?.campaigns?.active ? `${overview.campaigns.active} active` : undefined,
      icon: Megaphone,
      color: "text-pink-500",
    },
    {
      title: "Emails Sent",
      value: overview?.emails?.sent ?? "—",
      subtitle: overview?.emails?.opened ? `${overview.emails.opened} opened` : undefined,
      icon: Mail,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of leads, interactions, and performance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => (
            <Card key={w.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {w.title}
                </CardTitle>
                <w.icon className={`h-4 w-4 ${w.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{w.value}</div>
                {w.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{w.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lead Stats Breakdown */}
      {leadStats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leadStats.by_status?.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-medium">{s.count}</span>
                  </div>
                ))}
                {(!leadStats.by_status || leadStats.by_status.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Leads by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leadStats.by_source?.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-medium">{s.count}</span>
                  </div>
                ))}
                {(!leadStats.by_source || leadStats.by_source.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interaction Stats */}
      {interactionStats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Interactions by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interactionStats.by_channel?.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-medium">{s.count}</span>
                  </div>
                ))}
                {(!interactionStats.by_channel || interactionStats.by_channel.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Interactions by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interactionStats.by_priority?.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-medium">{s.count}</span>
                  </div>
                ))}
                {(!interactionStats.by_priority || interactionStats.by_priority.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
