"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { CHANNEL_FOLDERS } from "@/lib/mock/interactions";
import { toast } from "sonner";

const CHANNELS = CHANNEL_FOLDERS.filter((c) => c.channel !== "all");
const PRIORITIES = ["low", "medium", "high", "urgent"];
const CLASSES = ["Bronze", "Silver", "Gold", "Platinum"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}

const empty = {
  customerName: "", email: "", phone: "", location: "",
  channel: "email", priority: "medium", classification: "Bronze",
  subject: "", message: "",
};

export function NewTicketModal({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState(empty);
  const qc = useQueryClient();

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => api.ticketWorkspace.create(form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["ticket-workspace"] });
      toast.success("Ticket created", { description: `#${res.data.ticketNo}` });
      onCreated(res.data.id);
      onOpenChange(false);
      setForm(empty);
    },
    onError: (e: Error) => toast.error("Could not create ticket", { description: e.message }),
  });

  const valid = form.customerName.trim() && form.subject.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Ticket</DialogTitle>
          <DialogDescription>Create an omni-channel ticket. It is saved to the backend and appears in the list.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <FieldFull label="Customer Name" required>
            <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="e.g. Rahul Sharma" className="h-9" />
          </FieldFull>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" className="h-9" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91…" className="h-9" />
          </Field>
          <Field label="Channel">
            <Select value={form.channel} onChange={(v) => set("channel", v)} options={CHANNELS.map((c) => ({ value: c.channel, label: c.label }))} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City / State" className="h-9" />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(v) => set("priority", v)} options={PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} />
          </Field>
          <Field label="Classification">
            <Select value={form.classification} onChange={(v) => set("classification", v)} options={CLASSES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <FieldFull label="Subject" required>
            <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Short summary" className="h-9" />
          </FieldFull>
          <FieldFull label="First Message">
            <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="What did the customer say?" className="min-h-[72px] resize-none" />
          </FieldFull>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}
function FieldFull({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="col-span-2"><Field label={label} required={required}>{children}</Field></div>;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
