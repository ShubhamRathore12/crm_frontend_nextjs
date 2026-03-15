"use client";

import { useState, useEffect } from "react";
import { api, type SalesTask, type CreateSalesTask } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Clock, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const statusOptions: { key: SalesTask["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "ready_for_launch", label: "Ready For Launch" },
  { key: "launched", label: "Launched" },
  { key: "completed", label: "Completed" },
];

const priorityOptions: { key: SalesTask["priority"]; label: string; color: string }[] = [
  { key: "low", label: "Low", color: "text-blue-400" },
  { key: "medium", label: "Medium", color: "text-amber-400" },
  { key: "high", label: "High", color: "text-orange-400" },
  { key: "critical", label: "Critical", color: "text-red-400" },
];

interface TaskDetailModalProps {
  task: SalesTask | null;
  isNew?: boolean;
  defaultStatus?: SalesTask["status"];
  onClose: () => void;
  onSave: () => void;
}

export function TaskDetailModal({ task, isNew, defaultStatus, onClose, onSave }: TaskDetailModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SalesTask["status"]>("todo");
  const [priority, setPriority] = useState<SalesTask["priority"]>("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("0");
  const [effortHours, setEffortHours] = useState("0");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setStartDate(task.start_date ?? "");
      setEndDate(task.end_date ?? "");
      setEstimatedHours(String(task.estimated_hours));
      setEffortHours(String(task.effort_hours));
      setCategory(task.category);
      setDepartment(task.department);
      setTagsStr(task.tags.join(", "));
    } else if (isNew) {
      setStatus(defaultStatus ?? "todo");
    }
  }, [task, isNew, defaultStatus]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    const body: CreateSalesTask = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      tags,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      estimated_hours: parseFloat(estimatedHours) || 0,
      effort_hours: parseFloat(effortHours) || 0,
      category: category.trim(),
      department: department.trim(),
    };

    try {
      if (isNew) {
        await api.salesMarketing.tasks.create(body);
      } else if (task) {
        await api.salesMarketing.tasks.update(task.id, body);
      }
      onSave();
      onClose();
    } catch (e) {
      console.error("Failed to save task", e);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!task || !confirm("Delete this task?")) return;
    try {
      await api.salesMarketing.tasks.delete(task.id);
      onSave();
      onClose();
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">
              {isNew ? "New Task" : `SM-${task?.id.slice(0, 4).toUpperCase()}`}
            </span>
            {!isNew && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Updated {task && new Date(task.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {(["details", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-2.5 px-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "details" ? "Basic Details" : "Activity"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === "details" ? (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SalesTask["status"])}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SalesTask["priority"])}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {priorityOptions.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Hours</label>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    min="0"
                    step="0.5"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Effort Hours</label>
                  <input
                    type="number"
                    value={effortHours}
                    onChange={(e) => setEffortHours(e.target.value)}
                    min="0"
                    step="0.5"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Category & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Content, Ads"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Marketing"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="Comma-separated tags"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Activity timeline will appear here when the backend is connected.</p>
              {task && (
                <div className="mt-4 space-y-2 text-sm">
                  <p>Created: {new Date(task.created_at).toLocaleString()}</p>
                  <p>Updated: {new Date(task.updated_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div>
            {!isNew && (
              <Button onClick={handleDelete} variant="outline" size="sm" className="gap-1 text-red-400 hover:text-red-300 hover:border-red-400/50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" size="sm">Cancel</Button>
            <Button onClick={handleSave} size="sm" disabled={saving || !title.trim()} className="gap-1">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : isNew ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
