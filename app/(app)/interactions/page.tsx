"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import {
  Plus, Search, MessageSquare, Phone, Mail, MessageCircle,
  Video, Users, AlertTriangle, ChevronRight, Clock,
  User, Filter,
} from "lucide-react";
import { api, Interaction } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// ── Config ──────────────────────────────────────────────────────────────────
const channelConfig: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
  email: { icon: Mail, color: "text-blue-500", bg: "bg-blue-500/10" },
  phone: { icon: Phone, color: "text-green-500", bg: "bg-green-500/10" },
  sms: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
  chat: { icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  whatsapp: { icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  video_call: { icon: Video, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  in_person: { icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
};

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  new: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  assigned: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  in_progress: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  pending: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  on_hold: { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  resolved: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  escalated: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  closed: { color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
};

const priorityConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  low: { color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20", dot: "bg-gray-400" },
  medium: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-500" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-500" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500 animate-pulse" },
};

function getChannel(ch: string) { return channelConfig[ch] || channelConfig.chat; }
function getStatus(st: string) { return statusConfig[st] || statusConfig.new; }
function getPriority(pr: string) { return priorityConfig[pr] || priorityConfig.medium; }

// ── Shimmer ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="rounded-lg border p-3 text-center space-y-1.5">
      <div className="h-6 w-8 mx-auto rounded animate-shimmer" />
      <div className="h-3 w-16 mx-auto rounded animate-shimmer" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg animate-shimmer" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded animate-shimmer" />
              <div className="h-3 w-24 rounded animate-shimmer" />
            </div>
          </div>
          <div className="h-5 w-16 rounded animate-shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded animate-shimmer" />
          <div className="h-5 w-14 rounded animate-shimmer" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-20 rounded animate-shimmer" />
          <div className="h-3 w-16 rounded animate-shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function InteractionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["interactions", page, statusFilter, channelFilter],
    queryFn: () =>
      api.interactions.list({
        page: String(page),
        limit: "20",
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
      }),
  });

  useEffect(() => {
    if (!data?.data) return;
    if (page === 1) {
      setAccumulated(data.data);
    } else {
      setAccumulated((prev) => {
        const ids = new Set(prev.map((i: any) => i.id));
        const newItems = data.data.filter((i: any) => !ids.has(i.id));
        return newItems.length ? [...prev, ...newItems] : prev;
      });
    }
  }, [data, page]);

  const total = data?.total ?? 0;
  const hasMore = accumulated.length < total;

  const resetScroll = useCallback(() => setPage(1), []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.interactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      setPage(1);
      setDeleteTarget(null);
      toast.success("Interaction deleted");
    },
    onError: (err: Error) => toast.error("Failed to delete", { description: err.message }),
  });

  // Client-side filter for search + priority (API handles status/channel)
  const filtered = useMemo(() => {
    return accumulated.filter((item: any) => {
      if (priorityFilter && item.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = item.contacts?.name || item.contact_name || "";
        const email = item.contacts?.email || "";
        return (
          item.subject.toLowerCase().includes(q) ||
          name.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          item.channel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accumulated, searchQuery, priorityFilter]);

  // Compute stats from current data
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    accumulated.forEach((item: any) => {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      byChannel[item.channel] = (byChannel[item.channel] || 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
    });
    return { byStatus, byChannel, byPriority, total: accumulated.length };
  }, [accumulated]);

  const allStatuses = useMemo(() => [...new Set(accumulated.map((i: any) => i.status))].sort(), [accumulated]);
  const allChannels = useMemo(() => [...new Set(accumulated.map((i: any) => i.channel))].sort(), [accumulated]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Interactions</h1>
          <p className="text-muted-foreground text-sm">
            Manage customer communications across all channels.
          </p>
        </div>
        <Button asChild size="sm" className="self-start sm:self-auto">
          <Link href="/interactions/new">
            <Plus className="h-4 w-4 mr-2" />
            New Interaction
          </Link>
        </Button>
      </div>

      {/* Stats summary */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <div className="rounded-lg border p-2.5 md:p-3 text-center">
            <div className="text-lg md:text-xl font-bold">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total</div>
          </div>
          {Object.entries(stats.byStatus).slice(0, 4).map(([status, count]) => {
            const cfg = getStatus(status);
            return (
              <div
                key={status}
                className={cn("rounded-lg border p-2.5 md:p-3 text-center cursor-pointer transition-all hover:shadow-md", statusFilter === status ? cfg.bg : "")}
                onClick={() => { setStatusFilter(statusFilter === status ? "" : status); resetScroll(); }}
              >
                <div className={cn("text-lg md:text-xl font-bold", cfg.color)}>{count}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium capitalize">{status.replace(/_/g, " ")}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); resetScroll(); }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Status</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => { setChannelFilter(e.target.value); resetScroll(); }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Channels</option>
          {allChannels.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, (ch: string) => ch.toUpperCase())}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="text-xs text-muted-foreground self-center ml-auto hidden sm:block">
          {filtered.length} interactions
        </span>
      </div>

      {/* Interaction Cards */}
      {isLoading && accumulated.length === 0 ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No interactions found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new interaction.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item: any) => {
              const chCfg = getChannel(item.channel);
              const stCfg = getStatus(item.status);
              const prCfg = getPriority(item.priority);
              const ChannelIcon = chCfg.icon;
              const contactName = item.contacts?.name || item.contact_name || "Unknown";
              const contactEmail = item.contacts?.email || "";

              return (
                <Card key={item.id} className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                  {/* Priority indicator strip */}
                  <div className={cn("h-1", prCfg.bg.replace("/10", "/40"))} />

                  <CardContent className="p-4 space-y-3">
                    {/* Subject + Channel */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0", chCfg.bg)}>
                          <ChannelIcon className={cn("h-4 w-4", chCfg.color)} />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/interactions/${item.id}`}
                            className="text-sm font-semibold truncate block group-hover:text-primary transition-colors"
                          >
                            {item.subject}
                          </Link>
                          <span className={cn("text-[10px] capitalize font-medium", chCfg.color)}>
                            {item.channel.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>

                    {/* Contact info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {contactName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{contactName}</div>
                        {contactEmail && <div className="text-[10px] text-muted-foreground truncate">{contactEmail}</div>}
                      </div>
                    </div>

                    {/* Status + Priority badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] capitalize", stCfg.color, stCfg.bg, stCfg.border)}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] capitalize", prCfg.color, prCfg.bg, prCfg.border)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full mr-1", prCfg.dot)} />
                        {item.priority}
                      </Badge>
                    </div>

                    {/* Footer: time + actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.assigned_to ? (
                          <Badge variant="secondary" className="text-[9px] py-0">Assigned</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 text-muted-foreground">Unassigned</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive"
                          onClick={(e) => { e.preventDefault(); setDeleteTarget(item); }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Interaction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.subject}&quot;</strong> with {deleteTarget?.contacts?.name || deleteTarget?.contact_name || "this contact"}? This action cannot be undone.
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
