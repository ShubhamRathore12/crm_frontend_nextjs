"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Folder, X } from "lucide-react";
import { FILTER_OPTIONS } from "@/lib/mock/interactions";
import { toast } from "sonner";

export function FilterBuilder({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [hasWords, setHasWords] = useState("");
  const [notWords, setNotWords] = useState("");
  const [classification, setClassification] = useState("Bronze");
  const [subStatus, setSubStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [matchChild, setMatchChild] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);

  const toggleFolder = (f: string) =>
    setFolders((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const save = () => {
    toast.success("Ticket filter saved (demo)", { description: `${folders.length} folder(s), classification: ${classification}` });
    onOpenChange(false);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Ticket Filter</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 pb-2">
          <Stepper n={1} label="Condition" sub="At least one field for condition" active={step === 1} onClick={() => setStep(1)} />
          <span className="h-px flex-1 bg-border" />
          <Stepper n={2} label="Action" sub="Action for filter" active={step === 2} onClick={() => setStep(2)} />
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Has Words">
                <Input value={hasWords} onChange={(e) => setHasWords(e.target.value)} placeholder="contains…" className="h-9" />
              </Field>
              <Field label="Does Not Have Words">
                <Input value={notWords} onChange={(e) => setNotWords(e.target.value)} placeholder="excludes…" className="h-9" />
              </Field>
              <Field label="Customer Classification">
                <Select value={classification} onChange={setClassification} options={FILTER_OPTIONS.classifications} />
              </Field>
              <Field label="Current SubStatus">
                <Select value={subStatus} onChange={setSubStatus} options={FILTER_OPTIONS.subStatuses} placeholder="Any" />
              </Field>
              <Field label="Filter Priority">
                <Select value={priority} onChange={setPriority} options={FILTER_OPTIONS.priorities} placeholder="Any" />
              </Field>
              <Field label="Has Attachment">
                <Select value="" onChange={() => {}} options={FILTER_OPTIONS.hasAttachment} placeholder="Any" />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Folders</p>
              <div className="mb-2 flex items-center gap-2">
                <Switch checked={matchChild} onCheckedChange={setMatchChild} id="match-child" />
                <Label htmlFor="match-child" className="text-xs">Match Child folders</Label>
              </div>
              <div className="mb-2 flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                <Folder className="h-3.5 w-3.5" /> Click a folder to add it to the filter.
              </div>

              {folders.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {folders.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                      {f}
                      <button onClick={() => toggleFolder(f)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Main Folders</p>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_OPTIONS.mainFolders.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFolder(f)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      folders.includes(f)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Set Status">
                <Select value="" onChange={() => {}} options={["Open", "Pending", "On Hold", "Resolved", "Closed"]} placeholder="No change" />
              </Field>
              <Field label="Assign To">
                <Select value="" onChange={() => {}} options={["Ankit Tiwari", "Siddhant Raj", "Sarah Khan", "Round Robin"]} placeholder="No change" />
              </Field>
              <Field label="Set Priority">
                <Select value="" onChange={() => {}} options={FILTER_OPTIONS.priorities} placeholder="No change" />
              </Field>
              <Field label="Add Tag">
                <Input placeholder="tag name" className="h-9" />
              </Field>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Tickets matching the conditions above will automatically have these actions applied.
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Next: Action</Button>
          ) : (
            <Button onClick={save}>Save Filter</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ n, label, sub, active, onClick }: { n: number; label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-left">
      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{n}</span>
      <div>
        <p className={cn("text-sm font-medium leading-tight", active ? "text-foreground" : "text-muted-foreground")}>{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
