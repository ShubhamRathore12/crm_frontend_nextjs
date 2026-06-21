"use client";

import { useState } from "react";
import { Drawer } from "./drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  Opp,
  OWNERS,
  STATUSES,
  STAGES,
  BROAD_PRODUCTS,
  COMPANIES,
  TASK_TYPES,
} from "./opp-data";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-secondary/60 px-3 py-2 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add Opportunity                                                     */
/* ------------------------------------------------------------------ */

export function AddOpportunityDrawer({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Opp> & { name: string }) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Open - Not Connected");
  const [stage, setStage] = useState("Prospect");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [broadProduct, setBroadProduct] = useState(BROAD_PRODUCTS[0]);
  const [company, setCompany] = useState(COMPANIES[0]);

  const save = () => {
    onSave({ name: name.trim(), status, stage, phone: phone ? `+91 ${phone}` : "", email, broadProduct, company });
    setName("");
    setPhone("");
    setEmail("");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add Opportunity - B2B"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field label="Opportunity Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact / opportunity name" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" required>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Stage" required>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue placeholder="Type to search" /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Section title="Section2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number" required>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-secondary px-3 text-sm">+91</span>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-l-none" placeholder="9876543210" />
              </div>
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Broad Product">
              <Select value={broadProduct} onValueChange={setBroadProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BROAD_PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Company">
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Add Task                                                            */
/* ------------------------------------------------------------------ */

export function AddTaskDrawer({
  open,
  onClose,
  opp,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  opp: Opp | null;
  onSave: (data: { type: string; due: string; owner: string; notes: string }) => void;
}) {
  const [type, setType] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [due, setDue] = useState("");
  const [owner, setOwner] = useState(OWNERS[0].name);
  const [notes, setNotes] = useState("");

  const groups = TASK_TYPES.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.toLowerCase().includes(typeSearch.toLowerCase())),
  })).filter((g) => g.items.length);

  const save = () => {
    onSave({ type, due, owner, notes });
    setType("");
    setTypeSearch("");
    setNotes("");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add Task"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!type} onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-5">
        {opp && (
          <div className="text-sm text-muted-foreground">
            For opportunity <span className="font-medium text-foreground">{opp.name}</span>
          </div>
        )}
        <Field label="Task Type" required>
          {type ? (
            <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
              <span>{type}</span>
              <button className="text-xs text-primary hover:underline" onClick={() => setType("")}>Change</button>
            </div>
          ) : (
            <div className="rounded-md border border-input">
              <div className="relative border-b border-border p-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input autoFocus value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)} placeholder="Type to Search" className="pl-8 h-9 border-0 focus-visible:ring-0" />
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {groups.map((g) => (
                  <div key={g.group}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">{g.group}</div>
                    {g.items.map((i) => (
                      <button
                        key={i}
                        onClick={() => setType(i)}
                        className="block w-full px-5 py-2 text-left text-sm text-primary hover:bg-secondary"
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                ))}
                {groups.length === 0 && <div className="px-3 py-4 text-center text-sm text-muted-foreground">No task types</div>}
              </div>
            </div>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due Date">
            <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field label="Owner">
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OWNERS.map((o) => <SelectItem key={o.email} value={o.name}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Edit Opportunity                                                    */
/* ------------------------------------------------------------------ */

export function EditOpportunityDrawer({
  open,
  onClose,
  opp,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  opp: Opp | null;
  onSave: (patch: Partial<Opp>) => void;
}) {
  const [form, setForm] = useState<Opp | null>(opp);
  const [lastId, setLastId] = useState<string | null>(null);

  // re-seed form when a different opp opens
  if (open && opp && opp.id !== lastId) {
    setLastId(opp.id);
    setForm(opp);
  }
  if (!open && lastId !== null) setLastId(null);

  if (!form) {
    return <Drawer open={open} onClose={onClose} title="Edit"><div /></Drawer>;
  }

  const set = (k: keyof Opp, v: string | number) => setForm({ ...form, [k]: v });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save &amp; Close</Button>
        </>
      }
    >
      <div className="space-y-6">
        <Section title="Opportunity Details">
          <Field label="Associated Contact" required>
            <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opportunity Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Source">
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="SMC Product">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Broad Product">
              <Select value={form.broadProduct} onValueChange={(v) => set("broadProduct", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BROAD_PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Company">
              <Select value={form.company} onValueChange={(v) => set("company", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Status & Owner">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" required>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Stage">
              <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Owner" required>
            <Select value={form.owner} onValueChange={(v) => set("owner", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OWNERS.map((o) => <SelectItem key={o.email} value={o.name}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Call Status">
            <Input value={form.callStatus} onChange={(e) => set("callStatus", e.target.value)} />
          </Field>
        </Section>

        <Section title="Attempts and Connects">
          <div className="grid grid-cols-2 gap-4">
            <Field label="No of Attempts">
              <Input type="number" value={form.noOfAttempts} onChange={(e) => set("noOfAttempts", Number(e.target.value))} />
            </Field>
            <Field label="No of Connects">
              <Input type="number" value={form.noOfConnects} onChange={(e) => set("noOfConnects", Number(e.target.value))} />
            </Field>
          </div>
        </Section>
      </div>
    </Drawer>
  );
}
