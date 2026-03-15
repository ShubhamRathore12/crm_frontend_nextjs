"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type SalesTask } from "@/lib/api";
import { TaskCard } from "./task-card";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusColumn = {
  key: SalesTask["status"];
  label: string;
  color: string;
};

const columns: StatusColumn[] = [
  { key: "todo", label: "To Do", color: "bg-slate-500" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-500" },
  { key: "ready_for_launch", label: "Ready For Launch", color: "bg-emerald-500" },
  { key: "launched", label: "Launched", color: "bg-sky-500" },
  { key: "completed", label: "Completed", color: "bg-violet-500" },
];

interface BoardViewProps {
  tasks: SalesTask[];
  onRefresh: () => void;
  onTaskClick: (task: SalesTask) => void;
  onCreateClick: (status?: SalesTask["status"]) => void;
}

export function BoardView({ tasks, onRefresh, onTaskClick, onCreateClick }: BoardViewProps) {
  const [draggedTask, setDraggedTask] = useState<SalesTask | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const grouped = columns.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

  const handleDragStart = (task: SalesTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    setDragOverCol(colKey);
  };

  const handleDrop = async (colKey: string) => {
    if (!draggedTask || draggedTask.status === colKey) {
      setDraggedTask(null);
      setDragOverCol(null);
      return;
    }
    try {
      await api.salesMarketing.tasks.update(draggedTask.id, { status: colKey as SalesTask["status"] });
      onRefresh();
    } catch (e) {
      console.error("Failed to update task status", e);
    }
    setDraggedTask(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {grouped.map((col) => (
        <div
          key={col.key}
          className={cn(
            "flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border border-border bg-secondary/30 transition-colors",
            dragOverCol === col.key && "border-primary/50 bg-primary/5"
          )}
          onDragOver={(e) => handleDragOver(e, col.key)}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={() => handleDrop(col.key)}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", col.color)} />
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-medium text-muted-foreground">
                {col.tasks.length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex flex-1 flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-280px)]">
            {col.key === "todo" && (
              <button
                onClick={() => onCreateClick(col.key)}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="h-4 w-4" /> Create
              </button>
            )}
            {col.tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task)}
                className={cn(
                  "transition-opacity",
                  draggedTask?.id === task.id && "opacity-40"
                )}
              >
                <TaskCard task={task} onClick={onTaskClick} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
