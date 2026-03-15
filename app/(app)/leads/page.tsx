"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { BulkUploadModal } from "@/components/leads/bulk-upload-modal";
import { api, Lead } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  qualified: "bg-green-500/10 text-green-500 border-green-500/20",
  converted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  proposal: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  negotiation: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  closed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  junk: "bg-red-500/10 text-red-500 border-red-500/20",
  lost: "bg-red-500/10 text-red-500 border-red-500/20",
};

const stageColors: Record<string, string> = {
  discovery: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  qualified: "bg-green-500/10 text-green-500 border-green-500/20",
  demo: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  presentation: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  proposal: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  negotiation: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  closing: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const columns: DataTableColumn<Lead>[] = [
  {
    key: "contact_name",
    header: "Contact",
    width: 180,
    searchable: true,
    filterValue: (lead) => lead.contacts?.name ?? "",
    render: (lead) => (
      <Link href={`/leads/${lead.id}`} className="font-medium hover:text-primary transition-colors">
        {lead.contacts?.name ?? "—"}
      </Link>
    ),
  },
  {
    key: "email",
    header: "Email",
    searchable: true,
    filterValue: (lead) => lead.contacts?.email ?? "",
    render: (lead) => (
      <span className="text-muted-foreground">{lead.contacts?.email ?? "—"}</span>
    ),
  },
  {
    key: "mobile",
    header: "Mobile",
    searchable: true,
    filterValue: (lead) => lead.contacts?.mobile ?? "",
    render: (lead) => (
      <span className="text-muted-foreground">{lead.contacts?.mobile ?? "—"}</span>
    ),
  },
  {
    key: "source",
    header: "Source",
    searchable: true,
    filterValue: (lead) => lead.source ?? "",
    render: (lead) => (
      <span className="text-muted-foreground capitalize">
        {lead.source?.replace("_", " ")}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    searchable: true,
    filterValue: (lead) => lead.status ?? "",
    render: (lead) => (
      <Badge variant="outline" className={statusColors[lead.status] || ""}>
        {lead.status}
      </Badge>
    ),
  },
  {
    key: "stage",
    header: "Stage",
    searchable: true,
    filterValue: (lead) => lead.stage ?? "",
    render: (lead) => (
      <Badge variant="outline" className={stageColors[lead.stage] || ""}>
        {lead.stage}
      </Badge>
    ),
  },
  {
    key: "product",
    header: "Product",
    searchable: true,
    filterValue: (lead) => lead.product ?? "",
    render: (lead) => (
      <span className="text-muted-foreground">{lead.product ?? "—"}</span>
    ),
  },
  {
    key: "campaign",
    header: "Campaign",
    searchable: true,
    filterValue: (lead) => lead.campaign ?? "",
    render: (lead) => (
      <span className="text-muted-foreground">{lead.campaign ?? "—"}</span>
    ),
  },
  {
    key: "score",
    header: "Score",
    render: (lead) => (
      <span className="text-muted-foreground">
        {lead.lead_scores ? (lead.lead_scores.score * 100).toFixed(0) + "%" : "—"}
      </span>
    ),
  },
  {
    key: "confidence",
    header: "Confidence",
    render: (lead) => (
      <span className="text-muted-foreground">
        {lead.lead_scores ? (lead.lead_scores.confidence * 100).toFixed(0) + "%" : "—"}
      </span>
    ),
  },
  {
    key: "created",
    header: "Created",
    render: (lead) => (
      <span className="text-muted-foreground">
        {new Date(lead.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export default function LeadsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Lead[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["leads", page, search, statusFilter],
    queryFn: () =>
      api.leads.list({
        page: String(page),
        limit: "20",
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Accumulate data across pages for infinite scroll
  useEffect(() => {
    if (!data?.data) return;
    if (page === 1) {
      setAccumulated(data.data);
    } else {
      setAccumulated((prev) => {
        const ids = new Set(prev.map((l) => l.id));
        const newItems = data.data.filter((l: Lead) => !ids.has(l.id));
        return newItems.length ? [...prev, ...newItems] : prev;
      });
    }
  }, [data, page]);

  const total = data?.total ?? 0;
  const hasMore = data?.hasNext ?? false;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.leads.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setPage(1);
      toast.success("Lead deleted successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to delete lead", { description: err.message });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage incoming leads, scores, and conversions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Link>
          </Button>
        </div>
      </div>

      <BulkUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        entityType="lead"
      />

      <DataTable<Lead>
        columns={columns}
        data={accumulated}
        total={total}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search leads..."
        onDelete={(id) => deleteMutation.mutate(id)}
        deleteLabel="this lead"
        entityLabel="leads"
        emptyMessage="No leads found. Create your first lead to get started."
        filters={
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
            <option value="junk">Junk</option>
            <option value="lost">Lost</option>
          </select>
        }
      />
    </div>
  );
}
