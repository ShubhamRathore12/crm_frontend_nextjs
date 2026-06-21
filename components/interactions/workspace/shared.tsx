"use client";

import {
  Mail, Phone, MessageCircle, MessagesSquare, Facebook,
  Instagram, Twitter, Linkedin, type LucideIcon,
} from "lucide-react";
import type { Channel, TicketStatus, Priority } from "@/lib/mock/interactions";
import { cn } from "@/lib/utils";

// ── Channel styling ──────────────────────────────────────────────────────────
export const channelMeta: Record<Channel, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  email:     { icon: Mail,          label: "Email",     color: "text-blue-600",    bg: "bg-blue-500/10" },
  call:      { icon: Phone,         label: "Call",      color: "text-emerald-600", bg: "bg-emerald-500/10" },
  whatsapp:  { icon: MessageCircle, label: "WhatsApp",  color: "text-green-600",   bg: "bg-green-500/10" },
  chat:      { icon: MessagesSquare,label: "Live Chat", color: "text-cyan-600",    bg: "bg-cyan-500/10" },
  facebook:  { icon: Facebook,      label: "Facebook",  color: "text-[#1877F2]",   bg: "bg-blue-500/10" },
  instagram: { icon: Instagram,     label: "Instagram", color: "text-pink-600",    bg: "bg-pink-500/10" },
  twitter:   { icon: Twitter,       label: "Twitter",   color: "text-sky-500",     bg: "bg-sky-500/10" },
  linkedin:  { icon: Linkedin,      label: "LinkedIn",  color: "text-[#0A66C2]",   bg: "bg-blue-500/10" },
};

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const m = channelMeta[channel];
  const Icon = m.icon;
  return <Icon className={cn(m.color, className)} />;
}

export function ChannelChip({ channel, className }: { channel: Channel; className?: string }) {
  const m = channelMeta[channel];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center justify-center rounded-md p-1.5", m.bg, className)}>
      <Icon className={cn("h-3.5 w-3.5", m.color)} />
    </span>
  );
}

// ── Status styling ───────────────────────────────────────────────────────────
export const statusMeta: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  open:      { label: "Open",      color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  pending:   { label: "Pending",   color: "text-amber-600",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  on_hold:   { label: "On Hold",   color: "text-slate-600",   bg: "bg-slate-500/10",   border: "border-slate-500/20" },
  resolved:  { label: "Resolved",  color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  closed:    { label: "Closed",    color: "text-gray-500",    bg: "bg-gray-500/10",    border: "border-gray-500/20" },
  escalated: { label: "Escalated", color: "text-red-600",     bg: "bg-red-500/10",     border: "border-red-500/20" },
};

export const priorityMeta: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  low:    { label: "Low",    color: "text-gray-600",   bg: "bg-gray-500/10",   dot: "bg-gray-400" },
  medium: { label: "Medium", color: "text-blue-600",   bg: "bg-blue-500/10",   dot: "bg-blue-500" },
  high:   { label: "High",   color: "text-orange-600", bg: "bg-orange-500/10", dot: "bg-orange-500" },
  urgent: { label: "Urgent", color: "text-red-600",    bg: "bg-red-500/10",    dot: "bg-red-500 animate-pulse" },
};

export const classificationMeta: Record<string, { color: string; bg: string }> = {
  Bronze:   { color: "text-amber-700",   bg: "bg-amber-700/10" },
  Silver:   { color: "text-slate-500",   bg: "bg-slate-400/15" },
  Gold:     { color: "text-yellow-600",  bg: "bg-yellow-500/15" },
  Platinum: { color: "text-violet-600",  bg: "bg-violet-500/15" },
};

// ── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, color, className }: { name: string; color: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0", color, className)}>
      {initials}
    </span>
  );
}

// ── Time helpers ─────────────────────────────────────────────────────────────
export function shortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** Returns {label, breached} for an SLA due timestamp relative to `now`. */
export function slaInfo(dueIso: string, now: Date = new Date()) {
  const due = new Date(dueIso).getTime();
  const diffMs = due - now.getTime();
  const breached = diffMs < 0;
  const mins = Math.round(Math.abs(diffMs) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return { label, breached, mins: diffMs / 60000 };
}
