"use client";

import { useEffect, useState } from "react";
import { api, Interaction, Task } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  MessageSquare,
  Zap,
  User,
} from "lucide-react";

interface TimelineItem {
  id: string;
  type: "email" | "call" | "task" | "interaction";
  title: string;
  description?: string;
  timestamp: string;
  status?: string;
  channel?: string;
  icon: React.ReactNode;
  color: string;
}

export function UnifiedTimeline({ contactId }: { contactId: string }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [contactId]);

  const loadTimeline = async () => {
    try {
      const [interactions, tasks, emails] = await Promise.all([
        api.contacts.interactions(contactId).catch(() => []),
        api.tasks
          .list({})
          .then((r) => (r as any).data || [])
          .catch(() => []),
        api.contacts.emailHistory(contactId).catch(() => []),
      ]);

      const timelineItems: TimelineItem[] = [];

      // Interactions (calls, messages)
      (interactions || []).forEach((i: Interaction) => {
        const icon =
          i.channel === "phone" ? (
            <Phone className="h-4 w-4" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          );
        timelineItems.push({
          id: i.id,
          type: "interaction",
          title: i.subject || `${i.channel} interaction`,
          description: i.subject || `${i.channel} interaction`,
          timestamp: i.created_at,
          status: i.status,
          channel: i.channel,
          icon,
          color:
            i.channel === "phone"
              ? "bg-blue-500/10 text-blue-600"
              : "bg-purple-500/10 text-purple-600",
        });
      });

      // Emails
      (emails || []).forEach((e: any) => {
        timelineItems.push({
          id: e.id,
          type: "email",
          title: e.subject || "Email sent",
          description: e.body_preview || e.body,
          timestamp: e.sent_at || e.created_at,
          status: e.status,
          icon: <Mail className="h-4 w-4" />,
          color: "bg-green-500/10 text-green-600",
        });
      });

      // Tasks
      (tasks || [])
        .filter((t: Task) => t.entity_type === "contact" && t.entity_id === contactId)
        .forEach((t: Task) => {
          timelineItems.push({
            id: t.id,
            type: "task",
            title: t.title,
            description: t.description || "",
            timestamp: t.due_date || t.created_at,
            status: t.status,
            icon: (
              <CheckCircle2
                className={`h-4 w-4 ${t.status === "completed" ? "fill-current" : ""}`}
              />
            ),
            color: t.status === "completed"
              ? "bg-green-500/10 text-green-600"
              : "bg-amber-500/10 text-amber-600",
          });
        });

      // Sort by date descending
      timelineItems.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setItems(timelineItems);
    } catch (err) {
      console.error("Failed to load timeline", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading timeline...</div>;
  if (!items.length)
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No activity yet
      </div>
    );

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.id} className="flex gap-3">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`p-1.5 rounded-full ${item.color}`}>
              {item.icon}
            </div>
            {idx < items.length - 1 && (
              <div className="w-0.5 h-12 bg-border mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold truncate">{item.title}</h4>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {item.status || item.type}
              </Badge>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
            <time className="text-[11px] text-muted-foreground/60 mt-1 block">
              {new Date(item.timestamp).toLocaleString()}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
