"use client";

import { type SalesTask } from "@/lib/api";
import { Calendar, MoreVertical, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400",
  medium: "bg-amber-500/20 text-amber-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

interface TaskCardProps {
  task: SalesTask;
  onClick: (task: SalesTask) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const fmt = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
  };

  return (
    <div
      onClick={() => onClick(task)}
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug line-clamp-2">{task.title}</h4>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="rounded p-0.5 hover:bg-secondary">
            <Star className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button className="rounded p-0.5 hover:bg-secondary">
            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          SM-{task.id.slice(0, 4).toUpperCase()}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", priorityColors[task.priority] ?? priorityColors.medium)}>
          {task.priority}
        </span>
      </div>

      {(task.start_date || task.end_date) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {fmt(task.start_date)} {task.start_date && task.end_date ? "–" : ""} {fmt(task.end_date)}
          </span>
        </div>
      )}

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
