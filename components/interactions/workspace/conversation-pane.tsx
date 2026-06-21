"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Paperclip, Send, Phone, PhoneIncoming, PhoneMissed, FileText, ImageIcon,
  Sparkles, Languages, Smile, ChevronDown, Bot, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { translateMany } from "@/lib/translate";
import type { Ticket, Message } from "@/lib/mock/interactions";
import { ChannelIcon, Avatar, shortTime, channelMeta } from "./shared";
import { toast } from "sonner";

export function ConversationPane({ ticket }: { ticket: Ticket }) {
  const [draft, setDraft] = useState("");
  const [showAi, setShowAi] = useState(true);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [showTranslated, setShowTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);
  const qc = useQueryClient();

  // Reset translation state when switching tickets (message ids repeat per ticket).
  useEffect(() => {
    setTranslations({});
    setShowTranslated(false);
  }, [ticket.id]);

  const translate = async () => {
    // Toggle back to originals if already translated.
    if (showTranslated) { setShowTranslated(false); return; }
    if (Object.keys(translations).length) { setShowTranslated(true); return; }
    setTranslating(true);
    try {
      const results = await translateMany(ticket.messages.map((m) => m.body));
      const map: Record<string, string> = {};
      ticket.messages.forEach((m, i) => { map[m.id] = results[i]; });
      setTranslations(map);
      setShowTranslated(true);
      toast.success("Conversation translated to English");
    } catch (e) {
      toast.error("Translation failed", { description: (e as Error).message });
    } finally {
      setTranslating(false);
    }
  };

  const sendMutation = useMutation({
    mutationFn: (body: string) => {
      const msg: Message = {
        id: `m${Date.now()}`,
        direction: "outbound",
        author: "Ankit Tiwari",
        channel: ticket.channel,
        body,
        timestamp: new Date().toISOString(),
      };
      return api.ticketWorkspace.update(ticket.id, {
        messages: [...ticket.messages, msg],
        unread: false,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-workspace"] });
      toast.success("Reply sent", { description: `Via ${channelMeta[ticket.channel].label}` });
      setDraft("");
    },
    onError: (e: Error) => toast.error("Send failed", { description: e.message }),
  });

  const send = () => {
    if (!draft.trim()) return;
    sendMutation.mutate(draft.trim());
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ChannelIcon channel={ticket.channel} className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold leading-tight">{ticket.subject}</p>
            <p className="text-[11px] text-muted-foreground">#{ticket.ticketNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm"
            className={cn("h-7 gap-1 px-2 text-xs", showTranslated ? "text-primary" : "text-muted-foreground")}
            onClick={translate} disabled={translating}
          >
            {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
            {showTranslated ? "Show Original" : "Translate"}
          </Button>
        </div>
      </div>

      {/* AI summary banner */}
      {showAi && (
        <div className="mx-4 mt-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI Conversation Summary
            </span>
            <button onClick={() => setShowAi(false)}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-foreground/80">{ticket.aiSummary}</p>
        </div>
      )}

      {/* Thread */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Today</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          {ticket.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              customerColor={ticket.customer.avatarColor}
              translatedBody={showTranslated ? translations[m.id] : undefined}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <div className="rounded-lg border border-border bg-card focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Reply via ${channelMeta[ticket.channel].label}…`}
            className="min-h-[68px] resize-none border-0 bg-transparent text-sm focus-visible:ring-0"
          />
          <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground"><Smile className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-primary">
                <Bot className="h-3.5 w-3.5" /> AI Draft
              </Button>
            </div>
            <Button size="sm" className="h-7 gap-1.5" onClick={send} disabled={!draft.trim() || sendMutation.isPending}>
              {sendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, customerColor, translatedBody }: { message: Message; customerColor: string; translatedBody?: string }) {
  if (message.call) return <CallCard message={message} />;

  const outbound = message.direction === "outbound";
  const body = translatedBody ?? message.body;
  return (
    <div className={cn("flex gap-2.5", outbound && "flex-row-reverse")}>
      <Avatar
        name={message.author}
        color={outbound ? "bg-primary" : customerColor}
        className="mt-0.5 h-8 w-8 text-[11px]"
      />
      <div className={cn("max-w-[78%]", outbound && "items-end")}>
        <div className={cn("mb-1 flex items-center gap-2", outbound && "flex-row-reverse")}>
          <span className="text-xs font-semibold">{message.author}</span>
          <span className="text-[10px] text-muted-foreground">{shortTime(message.timestamp)}</span>
        </div>
        <div
          className={cn(
            "whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            outbound
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border bg-card"
          )}
        >
          {body}
          {translatedBody && translatedBody !== message.body && (
            <span className={cn("mt-1 block text-[9px] italic", outbound ? "text-primary-foreground/60" : "text-muted-foreground")}>translated</span>
          )}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn("mt-1.5 flex flex-wrap gap-1.5", outbound && "justify-end")}>
            {message.attachments.map((a) => (
              <span key={a.name} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px]">
                {a.type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="max-w-[120px] truncate">{a.name}</span>
                <span className="text-muted-foreground">{a.size}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CallCard({ message }: { message: Message }) {
  const call = message.call!;
  const Icon = call.status === "Unanswered" || call.status === "Missed" ? PhoneMissed : call.type === "Inbound" ? PhoneIncoming : Phone;
  const tone = call.status === "Answered" ? "text-emerald-600" : "text-red-600";
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-3.5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("rounded-lg bg-muted p-2", tone)}><Icon className="h-4 w-4" /></span>
        <div>
          <p className="text-sm font-semibold">{call.type} Call</p>
          <p className={cn("text-[11px] font-medium", tone)}>{call.status}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{message.call!.duration}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <Field label="Call From" value={call.from} />
        <Field label="Call To" value={call.to} />
        <Field label="Received" value={shortTime(message.timestamp)} />
        <Field label="Status" value={call.status} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
