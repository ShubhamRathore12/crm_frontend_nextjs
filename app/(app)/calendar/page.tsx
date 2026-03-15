"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

function CalendarSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-background/50 p-3 md:p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full animate-shimmer" />
          <div className="space-y-1.5">
            <div className="h-6 w-40 rounded animate-shimmer" />
            <div className="h-3 w-28 rounded animate-shimmer hidden sm:block" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded animate-shimmer" />
          <div className="h-8 w-16 rounded animate-shimmer" />
          <div className="h-8 w-8 rounded animate-shimmer" />
          <div className="h-8 w-24 rounded animate-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 rounded-xl border overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="p-3 flex justify-center">
                <div className="h-3 w-6 rounded animate-shimmer" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[60px] md:min-h-[100px] p-2 border-r border-b">
                <div className="h-5 w-5 rounded-full animate-shimmer mb-1" />
                {i % 5 === 0 && <div className="h-4 w-full rounded animate-shimmer mt-1" />}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border space-y-2">
              <div className="h-4 w-20 rounded animate-shimmer" />
              <div className="h-4 w-32 rounded animate-shimmer" />
              <div className="h-3 w-24 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const fetchLeads = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await api.leads.list();
        setLeads(res.data ?? []);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  if (loading) return <CalendarSkeleton />;

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-background/50 p-3 md:p-4 rounded-xl border backdrop-blur-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{format(currentDate, "MMMM yyyy")}</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest hidden sm:block">Unified CRM Schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-primary/5">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 px-3 font-medium">Today</Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-primary/5">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" className="h-8 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 ml-auto sm:ml-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Event</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 card-gradient rounded-xl md:rounded-2xl border bg-card/50 shadow-xl shadow-black/5 overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="p-2 md:p-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                <span className="md:hidden">{day}</span>
                <span className="hidden md:inline">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 min-h-0 divide-x divide-y border-l border-t">
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-muted/10 p-1 md:p-2 min-h-[60px] md:min-h-[100px]" />
            ))}
            {daysInMonth.map((day) => {
              const dayLeads = leads.filter(l => isSameDay(new Date(l.created_at), day));
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toString()} className={cn(
                  "min-h-[60px] md:min-h-[100px] p-1 md:p-2 hover:bg-primary/5 transition-colors group relative",
                  isToday && "bg-primary/5"
                )}>
                  <div className="flex justify-between items-start mb-0.5 md:mb-1">
                    <span className={cn(
                      "text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-all",
                      isToday ? "bg-primary text-primary-foreground shadow-md scale-110" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayLeads.length > 0 && (
                      <div className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    {dayLeads.slice(0, 3).map((lead, idx) => (
                      <div
                        key={lead.id}
                        className={`text-[9px] md:text-[10px] p-1 md:p-1.5 rounded bg-background border shadow-sm truncate hover:border-primary/40 hover:shadow-md transition-all cursor-pointer ${idx >= 1 ? "hidden md:block" : ""}`}
                      >
                        <span className="hidden md:inline font-semibold text-primary/70">Lead:</span> {lead.contacts?.name || lead.source}
                      </div>
                    ))}
                    {/* Mobile: show +N if more than 1 */}
                    {dayLeads.length > 1 && (
                      <div className="text-[9px] text-muted-foreground pl-1 font-medium italic md:hidden">
                        +{dayLeads.length - 1}
                      </div>
                    )}
                    {/* Desktop: show +N if more than 3 */}
                    {dayLeads.length > 3 && (
                      <div className="text-[9px] text-muted-foreground pl-1 font-medium italic hidden md:block">
                        +{dayLeads.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {leads.filter(l => new Date(l.created_at) > currentDate).slice(0, 5).map(lead => (
                <div key={lead.id} className="p-4 rounded-xl border bg-card/50 hover:border-primary/30 transition-all hover:bg-card shadow-sm hover:shadow-md group">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      {format(new Date(lead.created_at), "MMM d, HH:mm")}
                    </Badge>
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <h4 className="font-bold text-sm tracking-tight">{lead.source}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{lead.contacts?.name || "New inbound lead"}</p>
                </div>
              ))}
              {loading && <p className="text-sm text-muted-foreground italic animate-pulse text-center">Loading schedule...</p>}
              {!loading && leads.length === 0 && <p className="text-sm text-muted-foreground italic text-center">No upcoming events.</p>}
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-primary/10 bg-primary/5 shadow-inner">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Filter className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Active Filters</p>
                <p className="text-xs font-medium">All Leads, My Interactions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
