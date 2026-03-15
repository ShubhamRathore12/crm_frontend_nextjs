"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type SalesTask } from "@/lib/api";
import { BoardView } from "@/components/sales-marketing/board-view";
import { GridView } from "@/components/sales-marketing/grid-view";
import { CalendarView } from "@/components/sales-marketing/calendar-view";
import { FormsView } from "@/components/sales-marketing/forms-view";
import { TaskDetailModal } from "@/components/sales-marketing/task-detail-modal";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Table2,
  CalendarDays,
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "board" | "grid" | "calendar" | "forms";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "board", label: "Board", icon: LayoutGrid },
  { key: "grid", label: "Grid", icon: Table2 },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "forms", label: "Forms", icon: FileText },
];

export default function SalesMarketingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("board");
  const [tasks, setTasks] = useState<SalesTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalTask, setModalTask] = useState<SalesTask | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<SalesTask["status"]>("todo");
  const [showModal, setShowModal] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.salesMarketing.tasks.list();
      setTasks(data);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskClick = (task: SalesTask) => {
    setModalTask(task);
    setIsNewTask(false);
    setShowModal(true);
  };

  const handleCreateClick = (status?: SalesTask["status"]) => {
    setModalTask(null);
    setIsNewTask(true);
    setDefaultStatus(status ?? "todo");
    setShowModal(true);
  };

  const filteredTasks = searchQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tasks;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border bg-card/50 px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-semibold">Sales & Marketing</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Manage campaigns, tasks, and marketing workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadTasks} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => handleCreateClick()} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Task
            </Button>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 md:px-3 py-1.5 text-xs md:text-sm font-medium transition-all shrink-0",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab !== "forms" && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-sm w-full sm:w-56"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                <Filter className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Filter</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="mt-3 text-muted-foreground text-sm">Loading tasks…</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "board" && (
              <BoardView
                tasks={filteredTasks}
                onRefresh={loadTasks}
                onTaskClick={handleTaskClick}
                onCreateClick={handleCreateClick}
              />
            )}
            {activeTab === "grid" && (
              <GridView tasks={filteredTasks} onTaskClick={handleTaskClick} />
            )}
            {activeTab === "calendar" && (
              <CalendarView tasks={filteredTasks} onTaskClick={handleTaskClick} />
            )}
            {activeTab === "forms" && <FormsView />}
          </>
        )}
      </div>

      {/* Task detail modal */}
      {showModal && (
        <TaskDetailModal
          task={modalTask}
          isNew={isNewTask}
          defaultStatus={defaultStatus}
          onClose={() => setShowModal(false)}
          onSave={loadTasks}
        />
      )}
    </div>
  );
}
