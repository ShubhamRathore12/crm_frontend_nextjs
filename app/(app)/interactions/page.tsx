"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Headphones, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { TICKETS, type Ticket } from "@/lib/mock/interactions";
import { TicketList } from "@/components/interactions/workspace/ticket-list";
import { ConversationPane } from "@/components/interactions/workspace/conversation-pane";
import { ContextPanel } from "@/components/interactions/workspace/context-panel";
import { FilterBuilder } from "@/components/interactions/workspace/filter-builder";
import { NewTicketModal } from "@/components/interactions/workspace/new-ticket-modal";
import { Avatar } from "@/components/interactions/workspace/shared";

export default function InteractionsPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [available, setAvailable] = useState(true);
  // Mobile drill-down: which pane is visible
  const [mobilePane, setMobilePane] = useState<"list" | "convo" | "context">("list");

  // Fetch rich tickets from the backend; fall back to bundled dummy data so the
  // workspace always renders even before the DB has been seeded / when offline.
  const { data, isLoading } = useQuery({
    queryKey: ["ticket-workspace"],
    queryFn: () => api.ticketWorkspace.list(),
    retry: 1,
  });

  const tickets: Ticket[] =
    data?.data && data.data.length > 0 ? data.data : TICKETS;

  const [selectedId, setSelectedId] = useState(TICKETS[0].id);
  const ticket = tickets.find((t) => t.id === selectedId) ?? tickets[0];

  const select = (id: string) => {
    setSelectedId(id);
    setMobilePane("convo");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden md:h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">Tickets</h1>
          {isLoading && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" title="Syncing…" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAvailable((a) => !a)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              available ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", available ? "bg-emerald-500" : "bg-muted-foreground")} />
            {available ? "Available" : "Away"}
          </button>
          <button
            onClick={() => toast.message("Notifications", { description: "10 unread alerts" })}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent/10"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">10</span>
          </button>
          <button
            onClick={() => toast.success("Connected to support line", { description: "Headset ready" })}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent/10"
          >
            <Headphones className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
            <Avatar name="Ankit Tiwari" color="bg-indigo-500" className="h-6 w-6 text-[10px]" />
            <span className="text-xs font-medium">Ankit Tiwari</span>
          </div>
        </div>
      </header>

      {/* 3-pane workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr_400px]">
        {/* List */}
        <div className={cn("flex min-h-0 flex-col overflow-hidden", mobilePane !== "list" && "hidden md:flex")}>
          <TicketList tickets={tickets} selectedId={selectedId} onSelect={select} onOpenFilter={() => setFilterOpen(true)} onNewTicket={() => setNewOpen(true)} />
        </div>

        {/* Conversation */}
        <div className={cn("flex min-h-0 flex-col overflow-hidden", mobilePane !== "convo" && "hidden md:flex")}>
          <MobileBack show={mobilePane === "convo"} onBack={() => setMobilePane("list")} onContext={() => setMobilePane("context")} />
          <div className="min-h-0 flex-1"><ConversationPane ticket={ticket} /></div>
        </div>

        {/* Context */}
        <div className={cn("flex min-h-0 flex-col overflow-hidden", mobilePane !== "context" ? "hidden xl:flex" : "")}>
          <MobileBack show={mobilePane === "context"} onBack={() => setMobilePane("convo")} />
          <div className="min-h-0 flex-1"><ContextPanel ticket={ticket} /></div>
        </div>
      </div>

      <FilterBuilder open={filterOpen} onOpenChange={setFilterOpen} />
      <NewTicketModal
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => { setSelectedId(id); setMobilePane("convo"); }}
      />
    </div>
  );
}

function MobileBack({ show, onBack, onContext }: { show: boolean; onBack: () => void; onContext?: () => void }) {
  if (!show) return null;
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-1.5 md:hidden">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-primary">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      {onContext && (
        <button onClick={onContext} className="text-xs font-medium text-primary">Details</button>
      )}
    </div>
  );
}
