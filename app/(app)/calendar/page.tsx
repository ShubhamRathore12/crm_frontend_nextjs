"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter, Plus, Video, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api, CalendarEvent } from "@/lib/api";
import { toast } from "sonner";

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

const TYPE_COLORS: Record<string, string> = {
  meeting: "bg-blue-500",
  call: "bg-emerald-500",
  task: "bg-amber-500",
  reminder: "bg-purple-500",
  event: "bg-primary",
};

const emptyForm = {
  title: "",
  description: "",
  event_type: "meeting",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "10:00",
  duration: "30",
  location: "",
  add_meet_link: false,
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(() => {
    startTransition(async () => {
      try {
        const data = await api.calendar.events.list();
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openAddDialog = (day?: Date) => {
    setForm({ ...emptyForm, date: format(day ?? currentDate, "yyyy-MM-dd") });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const start = new Date(`${form.date}T${form.time}:00`);
      const end = new Date(start.getTime() + parseInt(form.duration || "30", 10) * 60000);
      await api.calendar.events.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        event_type: form.event_type,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: form.location.trim() || undefined,
        add_meet_link: form.add_meet_link,
      });
      toast.success("Event added");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchEvents();
    } catch (e) {
      toast.error((e as Error).message || "Failed to add event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.calendar.events.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event removed");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading) return <CalendarSkeleton />;

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const eventsForDay = (day: Date) =>
    events.filter((e) => {
      try {
        return isSameDay(new Date(e.start_time), day);
      } catch {
        return false;
      }
    });

  const upcoming = events
    .filter((e) => {
      try {
        return new Date(e.start_time) >= new Date();
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 6);

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
          <Button size="sm" onClick={() => openAddDialog()} className="h-8 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 ml-auto sm:ml-0">
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
              const dayEvents = eventsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  onClick={() => openAddDialog(day)}
                  className={cn(
                    "min-h-[60px] md:min-h-[100px] p-1 md:p-2 hover:bg-primary/5 transition-colors group relative cursor-pointer",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-0.5 md:mb-1">
                    <span className={cn(
                      "text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-all",
                      isToday ? "bg-primary text-primary-foreground shadow-md scale-110" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div
                        key={ev.id}
                        className={cn(
                          "text-[9px] md:text-[10px] p-1 md:p-1.5 rounded bg-background border shadow-sm truncate hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-1",
                          idx >= 1 ? "hidden md:flex" : "flex"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", TYPE_COLORS[ev.event_type] || "bg-primary")} />
                        {ev.meet_link && <Video className="h-2.5 w-2.5 text-primary shrink-0" />}
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 1 && (
                      <div className="text-[9px] text-muted-foreground pl-1 font-medium italic md:hidden">
                        +{dayEvents.length - 1}
                      </div>
                    )}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-muted-foreground pl-1 font-medium italic hidden md:block">
                        +{dayEvents.length - 3}
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
              {upcoming.map((ev) => (
                <div key={ev.id} className="p-4 rounded-xl border bg-card/50 hover:border-primary/30 transition-all hover:bg-card shadow-sm hover:shadow-md group">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      {format(new Date(ev.start_time), "MMM d, HH:mm")}
                    </Badge>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="h-6 w-6 rounded-full hover:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", TYPE_COLORS[ev.event_type] || "bg-primary")} />
                    <h4 className="font-bold text-sm tracking-tight truncate">{ev.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 capitalize">{ev.event_type}{ev.location ? ` • ${ev.location}` : ""}</p>
                  {ev.meet_link && (
                    <a
                      href={ev.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      <Video className="h-3 w-3" /> Join Google Meet
                    </a>
                  )}
                </div>
              ))}
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground italic text-center">No upcoming events.</p>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-primary/10 bg-primary/5 shadow-inner">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Filter className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Total Events</p>
                <p className="text-xs font-medium">{events.length} scheduled</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> New Event
            </DialogTitle>
            <DialogDescription>Schedule an event on your CRM calendar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title" placeholder="e.g. Advisory call with client"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ev-date">Date</Label>
                <Input
                  id="ev-date" type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ev-time">Time</Label>
                <Input
                  id="ev-time" type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Duration (min)</Label>
                <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="90">90</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-location">Location (optional)</Label>
              <Input
                id="ev-location" placeholder="Office / Online"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-desc">Notes (optional)</Label>
              <Textarea
                id="ev-desc" placeholder="Agenda or notes..."
                className="min-h-[70px] resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <Checkbox
                checked={form.add_meet_link}
                onCheckedChange={(c) => setForm({ ...form, add_meet_link: c as boolean })}
              />
              <Video className="h-4 w-4" />
              Add a Google Meet link
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
