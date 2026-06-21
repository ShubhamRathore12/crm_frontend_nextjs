"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ArrowLeft, ChevronDown, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  SAVED_VIEWS, CHANNEL_FOLDERS, type Ticket, type Channel,
} from "@/lib/mock/interactions";
import { ChannelIcon, Avatar, priorityMeta, slaInfo, dayLabel, channelMeta } from "./shared";

interface Props {
  tickets: Ticket[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpenFilter: () => void;
  onNewTicket: () => void;
}

export function TicketList({ tickets, selectedId, onSelect, onOpenFilter, onNewTicket }: Props) {
  const [view, setView] = useState(SAVED_VIEWS[0].id);
  const [channel, setChannel] = useState<Channel | "all">("all");
  const [query, setQuery] = useState("");
  const [showViews, setShowViews] = useState(false);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (channel !== "all" && t.channel !== channel) return false;
      if (view === "mine" && t.assignedTo?.id !== "a1") return false;
      if (view === "unassigned" && t.assignedTo) return false;
      if (view === "vip" && t.customer.classification !== "Platinum") return false;
      if (view === "overdue" && !slaInfo(t.slaDueAt).breached) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          t.customer.name.toLowerCase().includes(q) ||
          t.ticketNo.includes(q)
        );
      }
      return true;
    });
  }, [tickets, view, channel, query]);

  const activeView = SAVED_VIEWS.find((v) => v.id === view)!;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-card/40">
      {/* Header: view switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <button
          onClick={() => setShowViews((s) => !s)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          {activeView.label}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showViews && "rotate-180")} />
        </button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onOpenFilter} title="Add ticket filter">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* View dropdown */}
      {showViews && (
        <div className="border-b border-border bg-popover p-1">
          {SAVED_VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => { setView(v.id); setShowViews(false); }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-accent/10",
                view === v.id && "bg-accent/10 font-medium text-primary"
              )}
            >
              <span>{v.label}</span>
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{v.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Channel folder chips */}
      <ScrollArea className="border-b border-border">
        <div className="flex gap-1 px-3 pb-2">
          {CHANNEL_FOLDERS.map((f) => {
            const active = channel === f.channel;
            const Icon = f.channel === "all" ? null : channelMeta[f.channel as Channel].icon;
            return (
              <button
                key={f.channel}
                onClick={() => setChannel(f.channel)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {f.label}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Ticket rows */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">No tickets match.</div>
          )}
          {filtered.map((t) => (
            <TicketRow key={t.id} ticket={t} active={t.id === selectedId} onClick={() => onSelect(t.id)} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <Button size="sm" className="w-full gap-1.5" onClick={onNewTicket}>
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>
    </div>
  );
}

function TicketRow({ ticket, active, onClick }: { ticket: Ticket; active: boolean; onClick: () => void }) {
  const pr = priorityMeta[ticket.priority];
  const sla = slaInfo(ticket.slaDueAt);
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/5",
        active && "bg-accent/10",
        ticket.unread && "bg-primary/[0.03]"
      )}
    >
      {active && <span className="-ml-3 mr-0.5 w-0.5 rounded-r bg-primary" />}
      <div className="relative shrink-0">
        <Avatar name={ticket.customer.name} color={ticket.customer.avatarColor} className="h-9 w-9 text-xs" />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card bg-card">
          <ChannelIcon channel={ticket.channel} className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", ticket.unread ? "font-semibold" : "font-medium")}>
            {ticket.customer.name}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{dayLabel(ticket.createdAt)}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{ticket.subject}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide", pr.bg, pr.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", pr.dot)} />
            {ticket.priority}
          </span>
          {ticket.subStatus && (
            <span className="truncate rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{ticket.subStatus}</span>
          )}
          {sla.breached ? (
            <span className="ml-auto shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-600">SLA −{sla.label}</span>
          ) : (
            <span className="ml-auto shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">{sla.label}</span>
          )}
        </div>
      </div>
    </button>
  );
}
