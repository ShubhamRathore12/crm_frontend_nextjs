"use client";

import { type SalesTask } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

const priorityDot: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-400",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  ready_for_launch: "Ready",
  launched: "Launched",
  completed: "Done",
};

interface CalendarViewProps {
  tasks: SalesTask[];
  onTaskClick: (task: SalesTask) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const tasksByDate = useMemo(() => {
    const map = new Map<string, SalesTask[]>();
    tasks.forEach((t) => {
      const dates: string[] = [];
      if (t.start_date) dates.push(t.start_date);
      if (t.end_date && t.end_date !== t.start_date) dates.push(t.end_date);
      dates.forEach((d) => {
        const key = d.slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      });
    });
    return map;
  }, [tasks]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <button
            onClick={goToday}
            className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="rounded-md p-1.5 hover:bg-secondary transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextMonth} className="rounded-md p-1.5 hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Day names */}
        <div className="grid grid-cols-7 bg-secondary/40 border-b border-border">
          {dayNames.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-border">
          {cells.map((day, i) => {
            const dateStr = day
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : null;
            const dayTasks = dateStr ? tasksByDate.get(dateStr) ?? [] : [];

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] border-b border-border p-1.5 transition-colors",
                  day ? "hover:bg-secondary/20" : "bg-secondary/10",
                  i % 7 === 0 || i % 7 === 6 ? "bg-secondary/5" : ""
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayTasks.slice(0, 3).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] leading-tight transition-colors hover:bg-secondary/50 truncate"
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot[task.priority])} />
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="block px-1 text-[10px] text-muted-foreground">
                          +{dayTasks.length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
