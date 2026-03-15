"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, MessageSquare, Phone, Mail, MessageCircle } from "lucide-react";
import { api, Interaction } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { toast } from "sonner";

const channelIcons: Record<string, typeof MessageSquare> = {
  email: Mail,
  phone: Phone,
  sms: MessageCircle,
  chat: MessageSquare,
  whatsapp: MessageCircle,
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  assigned: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  in_progress: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
};

const columns: DataTableColumn<Interaction>[] = [
  {
    key: "channel",
    header: "Channel",
    width: 140,
    searchable: true,
    filterValue: (item) => item.channel ?? "",
    render: (item) => {
      const ChannelIcon = channelIcons[item.channel] || MessageSquare;
      return (
        <div className="flex items-center gap-2">
          <ChannelIcon className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{item.channel}</span>
        </div>
      );
    },
  },
  {
    key: "subject",
    header: "Subject",
    searchable: true,
    filterValue: (item) => item.subject ?? "",
    render: (item) => (
      <Link href={`/interactions/${item.id}`} className="font-medium hover:text-primary transition-colors">
        {item.subject}
      </Link>
    ),
  },
  {
    key: "contact",
    header: "Contact",
    searchable: true,
    filterValue: (item) => item.contact_name || "",
    render: (item) => <span className="text-muted-foreground">{item.contact_name || "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    searchable: true,
    filterValue: (item) => item.status?.replace("_", " ") ?? "",
    render: (item) => (
      <Badge variant="outline" className={statusColors[item.status] || ""}>
        {item.status.replace("_", " ")}
      </Badge>
    ),
  },
  {
    key: "priority",
    header: "Priority",
    searchable: true,
    filterValue: (item) => item.priority ?? "",
    render: (item) => (
      <Badge variant="outline" className={priorityColors[item.priority] || ""}>
        {item.priority}
      </Badge>
    ),
  },
  {
    key: "assigned",
    header: "Assigned",
    searchable: true,
    filterValue: (item) => item.assigned_name || "",
    render: (item) => <span className="text-muted-foreground">{item.assigned_name || "—"}</span>,
  },
  {
    key: "created",
    header: "Created",
    render: (item) => (
      <span className="text-muted-foreground">
        {new Date(item.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export default function InteractionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Interaction[]>([]);
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
        const ids = new Set(prev.map((i) => i.id));
        const newItems = data.data.filter((i: Interaction) => !ids.has(i.id));
        return newItems.length ? [...prev, ...newItems] : prev;
      });
    }
  }, [data, page]);

  const total = data?.total ?? 0;
  const hasMore = accumulated.length < total;

  const resetScroll = useCallback(() => {
    setPage(1);
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.interactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      setPage(1);
      toast.success("Interaction deleted successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to delete interaction", { description: err.message });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Interactions</h1>
          <p className="text-muted-foreground text-sm">
            Lifecycle: New &rarr; Assigned &rarr; In Progress &rarr; Resolved &rarr; Closed
          </p>
        </div>
        <Button asChild size="sm" className="md:size-default self-start sm:self-auto">
          <Link href="/interactions/new">
            <Plus className="h-4 w-4 mr-2" />
            New Interaction
          </Link>
        </Button>
      </div>

      <DataTable<Interaction>
        columns={columns}
        data={accumulated}
        total={total}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onDelete={(id) => deleteMutation.mutate(id)}
        deleteLabel="this interaction"
        entityLabel="interactions"
        emptyMessage="No interactions found."
        filters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); resetScroll(); }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); resetScroll(); }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="sms">SMS</option>
              <option value="chat">Chat</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </>
        }
      />
    </div>
  );
}
