"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Power, PowerOff, GitBranch } from "lucide-react";
import { api, Workflow } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { toast } from "sonner";

export default function WorkflowsPage() {
  const queryClient = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ["workflow-stats"],
    queryFn: () => api.workflows.stats(),
  });

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
    onError: (err: Error) => {
      toast.error("Failed to activate workflow", { description: err.message });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.workflows.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deactivated");
    },
    onError: (err: Error) => {
      toast.error("Failed to deactivate workflow", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to delete workflow", { description: err.message });
    },
  });

  const workflows: Workflow[] = data?.data ?? [];

  const columns: DataTableColumn<Workflow>[] = [
    {
      key: "name",
      header: "Workflow",
      width: 300,
      searchable: true,
      filterValue: (wf) => `${wf.name} ${wf.description ?? ""}`,
      render: (wf) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${wf.is_active ? "bg-green-500/10" : "bg-muted"}`}>
            <GitBranch className={`h-5 w-5 ${wf.is_active ? "text-green-500" : "text-muted-foreground"}`} />
          </div>
          <div>
            <Link href={`/workflows/${wf.id}`} className="font-medium hover:text-primary transition-colors">
              {wf.name}
            </Link>
            {wf.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{wf.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      searchable: true,
      filterValue: (wf) => wf.is_active ? "active" : "inactive",
      render: (wf) => (
        <Badge variant="outline" className={wf.is_active ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
          {wf.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "version",
      header: "Version",
      render: (wf) => <span className="text-muted-foreground text-xs">v{wf.version}</span>,
    },
    {
      key: "category",
      header: "Category",
      searchable: true,
      filterValue: (wf) => wf.category ?? "",
      render: (wf) =>
        wf.category ? (
          <Badge variant="outline" className="text-xs">{wf.category}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "toggle",
      header: "Toggle",
      render: (wf) =>
        wf.is_active ? (
          <Button variant="outline" size="sm" onClick={() => deactivateMutation.mutate(wf.id)}>
            <PowerOff className="h-4 w-4 mr-1" />
            Deactivate
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => activateMutation.mutate(wf.id)}>
            <Power className="h-4 w-4 mr-1" />
            Activate
          </Button>
        ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Workflows</h1>
          <p className="text-muted-foreground text-sm">
            Visual flow builder: Trigger &rarr; Assign &rarr; Send SMS &rarr; Delay &rarr; Escalate
          </p>
        </div>
        <Button asChild size="sm" className="md:size-default self-start sm:self-auto">
          <Link href="/workflows/new">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{statsData.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.total_runs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.success_rate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable<Workflow>
        columns={columns}
        data={workflows}
        isLoading={isLoading}
        onDelete={(id) => deleteMutation.mutate(id)}
        deleteLabel="this workflow"
        emptyMessage="No workflows found. Create your first automation."
      />
    </div>
  );
}
