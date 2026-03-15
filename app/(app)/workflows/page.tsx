"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import {
  Plus, Power, PowerOff, GitBranch, Search, AlertTriangle,
  CheckCircle2, XCircle, Clock, Activity, Zap, Filter,
  BarChart3, TrendingUp, Timer,
} from "lucide-react";
import { api, Workflow } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Category config ─────────────────────────────────────────────────────────
const categoryConfig: Record<string, { color: string; bg: string; border: string }> = {
  sales: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  automation: { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  marketing: { color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  support: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  notification: { color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
};

function getCatConfig(cat: string) {
  return categoryConfig[cat] || { color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const days = Math.floor(seconds / 86400);
  const hrs = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hrs}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// ── Shimmer skeletons ───────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 md:p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 rounded animate-shimmer" />
          <div className="h-8 w-8 rounded-lg animate-shimmer" />
        </div>
        <div className="h-7 w-14 rounded animate-shimmer" />
        <div className="h-1.5 w-full rounded-full animate-shimmer" />
      </CardContent>
    </Card>
  );
}

function WorkflowCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg animate-shimmer" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded animate-shimmer" />
              <div className="h-3 w-20 rounded animate-shimmer" />
            </div>
          </div>
          <div className="h-6 w-16 rounded animate-shimmer" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 rounded animate-shimmer" />
          <div className="h-12 rounded animate-shimmer" />
          <div className="h-12 rounded animate-shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => api.workflows.list(),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.workflows.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow activated");
    },
    onError: (err: Error) => toast.error("Failed to activate", { description: err.message }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.workflows.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deactivated");
    },
    onError: (err: Error) => toast.error("Failed to deactivate", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error("Failed to delete", { description: err.message }),
  });

  // Normalize: API may return { data: [...] } or [...]
  const rawWorkflows: any[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return (data as any).data ?? [];
  }, [data]);

  // Compute stats from actual workflow data
  const stats = useMemo(() => {
    const total = rawWorkflows.length;
    const active = rawWorkflows.filter((w) => w.active ?? w.is_active).length;
    const inactive = total - active;
    const totalRuns = rawWorkflows.reduce((sum, w) => sum + (w.total_runs ?? 0), 0);
    const successfulRuns = rawWorkflows.reduce((sum, w) => sum + (w.successful_runs ?? 0), 0);
    const failedRuns = rawWorkflows.reduce((sum, w) => sum + (w.failed_runs ?? 0), 0);
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
    const categories = [...new Set(rawWorkflows.map((w) => w.category).filter(Boolean))];
    return { total, active, inactive, totalRuns, successfulRuns, failedRuns, successRate, categories };
  }, [rawWorkflows]);

  // Filter workflows
  const filtered = useMemo(() => {
    return rawWorkflows.filter((w) => {
      const isActive = w.active ?? w.is_active;
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;
      if (categoryFilter && w.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return w.name.toLowerCase().includes(q) || (w.category || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [rawWorkflows, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Workflows</h1>
          <p className="text-muted-foreground text-sm">
            Automate your CRM processes with triggers, actions and schedules.
          </p>
        </div>
        <Button asChild size="sm" className="self-start sm:self-auto">
          <Link href="/workflows/new">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">Total Workflows</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <GitBranch className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{stats.total}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">{stats.active} active</Badge>
                <Badge variant="outline" className="text-[10px]">{stats.inactive} inactive</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">Total Runs</span>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalRuns}</div>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] text-green-500 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> {stats.successfulRuns}
                </span>
                <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                  <XCircle className="h-3 w-3" /> {stats.failedRuns}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">Success Rate</span>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{stats.successRate}%</div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", stats.successRate > 70 ? "bg-green-500" : stats.successRate > 40 ? "bg-yellow-500" : "bg-red-500")}
                  style={{ width: `${stats.successRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">Categories</span>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{stats.categories.length}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {stats.categories.map((cat) => (
                  <Badge key={cat} variant="outline" className={cn("text-[10px] capitalize", getCatConfig(cat).color, getCatConfig(cat).bg, getCatConfig(cat).border)}>
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Categories</option>
          {stats.categories.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5 self-start">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                statusFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground self-center ml-auto hidden sm:block">
          {filtered.length} of {rawWorkflows.length} workflows
        </span>
      </div>

      {/* Workflow Cards Grid */}
      {isLoading ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <WorkflowCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No workflows found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new workflow.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((wf) => {
            const isActive = wf.active ?? wf.is_active;
            const catCfg = getCatConfig(wf.category);
            const successPct = wf.total_runs > 0 ? Math.round((wf.successful_runs / wf.total_runs) * 100) : 0;
            const failPct = wf.total_runs > 0 ? Math.round((wf.failed_runs / wf.total_runs) * 100) : 0;

            return (
              <Card key={wf.id} className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                {/* Active indicator strip */}
                <div className={cn("h-1", isActive ? "bg-green-500" : "bg-muted")} />

                <CardContent className="p-4 space-y-3">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("p-2 rounded-lg shrink-0", catCfg.bg)}>
                        <GitBranch className={cn("h-4 w-4", catCfg.color)} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{wf.name}</h3>
                        <Badge variant="outline" className={cn("text-[10px] capitalize mt-0.5", catCfg.color, catCfg.bg, catCfg.border)}>
                          {wf.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "text-muted-foreground")}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Run stats mini-grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-xs font-bold">{wf.total_runs}</div>
                      <div className="text-[9px] text-muted-foreground">Runs</div>
                    </div>
                    <div className="rounded-lg bg-green-500/5 p-2 text-center">
                      <div className="text-xs font-bold text-green-500">{wf.successful_runs}</div>
                      <div className="text-[9px] text-muted-foreground">Success</div>
                    </div>
                    <div className="rounded-lg bg-red-500/5 p-2 text-center">
                      <div className="text-xs font-bold text-red-500">{wf.failed_runs}</div>
                      <div className="text-[9px] text-muted-foreground">Failed</div>
                    </div>
                  </div>

                  {/* Success rate bar */}
                  {wf.total_runs > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Success rate</span>
                        <span className="font-medium">{successPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                        {successPct > 0 && <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${successPct}%` }} />}
                        {failPct > 0 && <div className="h-full bg-red-500 rounded-r-full" style={{ width: `${failPct}%` }} />}
                      </div>
                    </div>
                  )}

                  {/* Avg execution time */}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Timer className="h-3 w-3" />
                    <span>Avg: {formatDuration(wf.avg_execution_time_seconds)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    {isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1"
                        onClick={() => deactivateMutation.mutate(wf.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        <PowerOff className="h-3 w-3" /> Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1 border-green-500/30 text-green-600 hover:bg-green-500/10"
                        onClick={() => activateMutation.mutate(wf.id)}
                        disabled={activateMutation.isPending}
                      >
                        <Power className="h-3 w-3" /> Activate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(wf)}
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Workflow
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.name}&quot;</strong>? This will remove all triggers, schedules, and run history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
