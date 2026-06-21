"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Info, User, Wallet, LayoutGrid, Zap, Phone, Mail, MessageCircle,
  MapPin, Hash, Tag, ChevronDown, Paperclip, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import type { Ticket } from "@/lib/mock/interactions";
import { AGENTS, type TicketStatus } from "@/lib/mock/interactions";

// Shared mutation: patch a ticket and refresh the workspace list.
function useTicketPatch(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Ticket>) => api.ticketWorkspace.update(ticketId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ticket-workspace"] }),
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });
}
import { Avatar, statusMeta, priorityMeta, classificationMeta, ChannelChip, slaInfo } from "./shared";
import { AccountInfo } from "./account-info";
import { Customer360View } from "./customer-360";
import { FastLane } from "./fast-lane";

type TabKey = "ticket" | "customer" | "account" | "c360" | "fastlane";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "ticket", label: "Details", icon: Info },
  { key: "customer", label: "Customer", icon: User },
  { key: "account", label: "Account", icon: Wallet },
  { key: "c360", label: "360", icon: LayoutGrid },
  { key: "fastlane", label: "Fast Lane", icon: Zap },
];

export function ContextPanel({ ticket }: { ticket: Ticket }) {
  const [tab, setTab] = useState<TabKey>("ticket");

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-card/40">
      {/* Content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-border">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="text-sm font-semibold">{TABS.find((t) => t.key === tab)!.label}</span>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3">
            {tab === "ticket" && <TicketDetails ticket={ticket} />}
            {tab === "customer" && <CustomerInfo ticket={ticket} />}
            {tab === "account" && <AccountInfo accounts={ticket.accounts} />}
            {tab === "c360" && <Customer360View data={ticket.customer360} />}
            {tab === "fastlane" && <FastLane customerName={ticket.customer.name} />}
          </div>
        </ScrollArea>
      </div>

      {/* Icon rail */}
      <div className="flex w-12 flex-col items-center gap-1 border-l border-border py-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              title={t.label}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Ticket Details tab ──────────────────────────────────────────────────────
function TicketDetails({ ticket }: { ticket: Ticket }) {
  const pr = priorityMeta[ticket.priority];
  const sla = slaInfo(ticket.slaDueAt);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={ticket.customer.name} color={ticket.customer.avatarColor} className="h-10 w-10 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{ticket.customer.name}</p>
            <p className="text-[11px] text-muted-foreground">Ticket #{ticket.ticketNo}</p>
          </div>
          <ChannelChip channel={ticket.channel} className="ml-auto" />
        </div>
      </div>

      <Row label="Status"><StatusSelect ticket={ticket} /></Row>
      <Row label="Sub Status"><span className="text-xs font-medium">{ticket.subStatus ?? "—"}</span></Row>
      <Row label="Priority">
        <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", pr.bg, pr.color)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", pr.dot)} />{pr.label}
        </span>
      </Row>
      <Row label="SLA">
        {sla.breached
          ? <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[11px] font-medium text-red-600">Breached −{sla.label}</span>
          : <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">{sla.label} left</span>}
      </Row>
      <Row label="First Response">
        <span className="text-xs font-medium">{ticket.firstResponseMins != null ? `${ticket.firstResponseMins} min` : "Pending"}</span>
      </Row>

      <Assignee ticket={ticket} />

      <div>
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Tag className="h-3 w-3" /> Tags
        </p>
        <div className="flex flex-wrap gap-1">
          {ticket.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      <Collapsible title="Attachments" icon={Paperclip}>
        {ticket.messages.flatMap((m) => m.attachments ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No attachments.</p>
        ) : (
          <div className="space-y-1">
            {ticket.messages.flatMap((m) => m.attachments ?? []).map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded border border-border px-2 py-1 text-[11px]">
                <span className="truncate">{a.name}</span>
                <span className="text-muted-foreground">{a.size}</span>
              </div>
            ))}
          </div>
        )}
      </Collapsible>
    </div>
  );
}

function Assignee({ ticket }: { ticket: Ticket }) {
  const patch = useTicketPatch(ticket.id);
  const current = ticket.assignedTo?.id ?? "";

  const onChange = (id: string) => {
    const agent = AGENTS.find((a) => a.id === id) ?? null;
    patch.mutate(
      { assignedTo: agent },
      { onSuccess: () => toast.success(agent ? `Assigned to ${agent.name}` : "Unassigned") }
    );
  };

  return (
    <Row label="Assigned To">
      <div className="flex items-center gap-1">
        {patch.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <select
          value={current}
          disabled={patch.isPending}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
        >
          <option value="">Unassigned</option>
          {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
    </Row>
  );
}

const STATUS_OPTIONS: TicketStatus[] = ["open", "pending", "on_hold", "resolved", "closed", "escalated"];

function StatusSelect({ ticket }: { ticket: Ticket }) {
  const patch = useTicketPatch(ticket.id);
  const st = statusMeta[ticket.status];

  const onChange = (status: string) => {
    patch.mutate(
      { status: status as TicketStatus },
      { onSuccess: () => toast.success(`Status → ${statusMeta[status as TicketStatus].label}`) }
    );
  };

  return (
    <div className="flex items-center gap-1">
      {patch.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      <select
        value={ticket.status}
        disabled={patch.isPending}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-7 rounded-md border border-input bg-background px-2 text-xs font-medium disabled:opacity-60", st.color)}
      >
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
      </select>
    </div>
  );
}

// ── Customer Info tab ───────────────────────────────────────────────────────
function CustomerInfo({ ticket }: { ticket: Ticket }) {
  const c = ticket.customer;
  const cls = classificationMeta[c.classification];
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center rounded-lg border border-border bg-card p-4">
        <Avatar name={c.name} color={c.avatarColor} className="h-14 w-14 text-lg" />
        <p className="mt-2 text-sm font-semibold">{c.name}</p>
        <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", cls.bg, cls.color)}>{c.classification}</span>
      </div>

      <div className="space-y-2.5 rounded-lg border border-border bg-card p-3">
        <IconRow icon={Mail} label="Email" value={c.emailMasked} />
        <IconRow icon={Phone} label="Phone" value={c.phoneMasked} actions />
        <IconRow icon={MapPin} label="Location" value={c.location} />
        <IconRow icon={Hash} label="Customer Code" value={c.customerCode} />
      </div>
    </div>
  );
}

function IconRow({ icon: Icon, label, value, actions }: { icon: any; label: string; value: string; actions?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="rounded-md bg-muted p-1.5 text-muted-foreground"><Icon className="h-3.5 w-3.5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-medium">{value}</p>
      </div>
      {actions && (
        <div className="flex gap-1">
          <button className="rounded p-1 text-emerald-600 hover:bg-emerald-500/10"><Phone className="h-3.5 w-3.5" /></button>
          <button className="rounded p-1 text-green-600 hover:bg-green-500/10"><MessageCircle className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}

// ── Primitives ──────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Collapsible({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent/5">
        <span className="flex items-center gap-1.5 text-xs font-semibold"><Icon className="h-3.5 w-3.5" /> {title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}
