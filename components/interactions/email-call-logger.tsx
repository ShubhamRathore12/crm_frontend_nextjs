"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface EmailCallLoggerProps {
  contactId: string;
  type: "email" | "call";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmailCallLogger({
  contactId,
  type,
  open,
  onOpenChange,
  onSuccess,
}: EmailCallLoggerProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    body: "",
    duration: "",
    status: "completed",
  });

  const handleSubmit = async () => {
    if (type === "email" && !form.subject) {
      toast.error("Subject required");
      return;
    }
    if (!form.body) {
      toast.error("Notes required");
      return;
    }

    setLoading(true);
    try {
      await api.interactions.create({
        contact_id: contactId,
        channel: type === "email" ? "email" : "phone",
        status: form.status,
        subject: form.subject || `${type} logged`,
        description: form.body,
        notes: form.duration ? `Duration: ${form.duration} min` : undefined,
      });
      toast.success(`${type} logged`);
      setForm({ subject: "", body: "", duration: "", status: "completed" });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(`Failed to log ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const Icon = type === "email" ? Mail : Phone;
  const title = type === "email" ? "Log Email" : "Log Call";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {type === "email" && (
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Subject
              </label>
              <Input
                placeholder="Email subject"
                value={form.subject}
                onChange={(e) =>
                  setForm({ ...form, subject: e.target.value })
                }
              />
            </div>
          )}

          {type === "call" && (
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Duration (minutes)
              </label>
              <Input
                type="number"
                placeholder="e.g., 15"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">Notes</label>
            <Textarea
              placeholder={
                type === "email"
                  ? "Email content / key points"
                  : "Call summary / action items"
              }
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Status</label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending Follow-up</SelectItem>
                <SelectItem value="failed">Bounced / No Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
