"use client";

import { type SalesTask } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

const priorityColors: Record<string, string> = {
  low: "text-blue-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  ready_for_launch: "Ready For Launch",
  launched: "Launched",
  completed: "Completed",
};

const statusColors: Record<string, string> = {
  todo: "bg-slate-500/20 text-slate-400",
  in_progress: "bg-amber-500/20 text-amber-400",
  ready_for_launch: "bg-emerald-500/20 text-emerald-400",
  launched: "bg-sky-500/20 text-sky-400",
  completed: "bg-violet-500/20 text-violet-400",
};

type SortKey = "title" | "priority" | "status" | "start_date" | "end_date" | "created_at";

interface GridViewProps {
  tasks: SalesTask[];
  onTaskClick: (task: SalesTask) => void;
}

export function GridView({ tasks, onTaskClick }: GridViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (filterStatus) result = result.filter((t) => t.status === filterStatus);
    if (filterPriority) result = result.filter((t) => t.priority === filterPriority);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [tasks, filterStatus, filterPriority, searchQuery, sortKey, sortAsc]);

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

  const SortHeader = ({ label, sKey }: { label: string; sKey: SortKey }) => (
    <th
      className="cursor-pointer select-none py-3 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => toggleSort(sKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3 w-3", sortKey === sKey ? "text-primary" : "text-muted-foreground/50")} />
      </span>
    </th>
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-60"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Status</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <SortHeader label="ID" sKey="created_at" />
                <SortHeader label="Title" sKey="title" />
                <th className="py-3 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tags</th>
                <SortHeader label="Start" sKey="start_date" />
                <SortHeader label="End" sKey="end_date" />
                <SortHeader label="Priority" sKey="priority" />
                <SortHeader label="Status" sKey="status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="cursor-pointer transition-colors hover:bg-secondary/30"
                >
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                    SM-{task.id.slice(0, 4).toUpperCase()}
                  </td>
                  <td className="py-2.5 px-3 font-medium max-w-[280px] truncate">{task.title}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1">
                      {task.tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{fmt(task.start_date)}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{fmt(task.end_date)}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn("text-xs font-semibold uppercase", priorityColors[task.priority])}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColors[task.status])}>
                      {statusLabels[task.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">No tasks found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
