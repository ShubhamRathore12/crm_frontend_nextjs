"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Drawer } from "@/components/opportunities/drawer";
import { toast } from "sonner";
import {
  ArrowLeft,
  Activity as ActivityIcon,
  StickyNote,
  CheckSquare,
  Mail,
  MoreHorizontal,
  GitBranch,
  Plus,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FileText,
  Share2,
  Download,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  OPPS,
  OWNERS,
  TASK_TYPES,
  ACTIVITIES,
  ACTIVITY_TYPES,
  Activity,
  fmtDateTime,
  fmtDay,
  fmtTimeAgo,
} from "@/components/opportunities/opp-data";

const TABS = ["Activity History", "Product Opportunity", "Tasks", "Documents", "Opportunity Share"];

const DATE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
  { value: "yesterday", label: "Yesterday" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisWeek", label: "This Week" },
  { value: "nextWeek", label: "Next Week" },
  { value: "last7", label: "Last 7 Days" },
  { value: "next7", label: "Next 7 Days" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last30", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "nextMonth", label: "Next Month" },
  { value: "lastYear", label: "Last Year" },
  { value: "thisYear", label: "This Year" },
];

const DAY = 86400000;
function startOfDay(x: Date) { const c = new Date(x); c.setHours(0, 0, 0, 0); return c; }
function dateInRange(iso: string, opt: string): boolean {
  if (opt === "all" || opt === "custom") return true;
  const d = new Date(iso);
  const now = new Date();
  const today = startOfDay(now);
  const day = today.getTime();
  const startWeek = day - today.getDay() * DAY;
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const startYear = new Date(today.getFullYear(), 0, 1).getTime();
  const t = d.getTime();
  switch (opt) {
    case "today": return startOfDay(d).getTime() === day;
    case "yesterday": return startOfDay(d).getTime() === day - DAY;
    case "tomorrow": return startOfDay(d).getTime() === day + DAY;
    case "last7": return t >= day - 7 * DAY && t <= now.getTime();
    case "next7": return t >= now.getTime() && t <= day + 7 * DAY;
    case "last30": return t >= day - 30 * DAY && t <= now.getTime();
    case "thisWeek": return t >= startWeek && t < startWeek + 7 * DAY;
    case "lastWeek": return t >= startWeek - 7 * DAY && t < startWeek;
    case "nextWeek": return t >= startWeek + 7 * DAY && t < startWeek + 14 * DAY;
    case "thisMonth": return t >= startMonth && new Date(t).getMonth() === today.getMonth();
    case "lastMonth": { const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1); return new Date(t).getMonth() === lm.getMonth() && new Date(t).getFullYear() === lm.getFullYear(); }
    case "nextMonth": { const nm = new Date(today.getFullYear(), today.getMonth() + 1, 1); return new Date(t).getMonth() === nm.getMonth() && new Date(t).getFullYear() === nm.getFullYear(); }
    case "thisYear": return t >= startYear && new Date(t).getFullYear() === today.getFullYear();
    case "lastYear": return new Date(t).getFullYear() === today.getFullYear() - 1;
    default: return true;
  }
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const opp = useMemo(() => OPPS.find((o) => o.id === id) ?? OPPS[0], [id]);

  const [tab, setTab] = useState(TABS[0]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [notes, setNotes] = useState<{ id: string; text: string; at: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [openActivity, setOpenActivity] = useState<Activity | null>(null);

  const activities = ACTIVITIES.filter(
    (a) => (typeFilter === "all" || a.type === typeFilter) && dateInRange(a.at, dateFilter)
  );

  // group activities by day
  const grouped = useMemo(() => {
    const m = new Map<string, Activity[]>();
    activities.forEach((a) => {
      const k = fmtDay(a.at);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    });
    return Array.from(m.entries());
  }, [activities]);

  const addNote = () => {
    if (!draft.trim()) return;
    setNotes((n) => [{ id: `n${n.length}`, text: draft.trim(), at: new Date().toISOString() }, ...n]);
    setDraft("");
    toast.success("Note added");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      {/* left contact card */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-border bg-card overflow-y-auto">
        <div className="p-4 space-y-4">
          <button onClick={() => router.push("/opportunities")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><GitBranch className="h-5 w-5" /></div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{opp.name}</div>
              <Badge variant="secondary" className="mt-1 font-medium">{opp.status}</Badge>
            </div>
          </div>
          <Link href={`/contacts/${opp.id}`} className="block text-sm text-primary hover:underline">{opp.contactName}</Link>

          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              { icon: ActivityIcon, label: "Activity", fn: () => toast.success("Activity") },
              { icon: StickyNote, label: "Note", fn: () => toast.success("Note") },
              { icon: CheckSquare, label: "Tasks", fn: () => toast.success("Tasks") },
              { icon: Mail, label: "Email", fn: () => toast.success("Email") },
            ].map((a) => (
              <button key={a.label} onClick={a.fn} className="flex flex-col items-center gap-1 rounded-md py-2 text-primary hover:bg-secondary text-xs">
                <a.icon className="h-4 w-4" /> {a.label}
              </button>
            ))}
          </div>

          <Section title="Details">
            <RowKV k="Contact Name" v={opp.contactName} />
            <RowKV k="Opportunity Name" v={opp.name} />
            <RowKV k="Status" v={opp.status} />
            <RowKV k="Stage" v={opp.stage} />
            <RowKV k="Owner" v={opp.owner} />
          </Section>

          <Section title="Product Opportunity Properties">
            <RowKV k="Opportunity ID" v={opp.opportunityId} />
            <RowKV k="Talisma ID" v={opp.talismaId} />
            <RowKV k="Broad Product" v={opp.broadProduct} />
            <RowKV k="Company" v={opp.company} />
            <RowKV k="No of Attempts" v={String(opp.noOfAttempts)} />
            <RowKV k="No of Connects" v={String(opp.noOfConnects)} />
          </Section>
        </div>
      </aside>

      {/* center */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* tabs */}
        <div className="flex items-center gap-1 border-b border-border px-4 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors " +
                (tab === t ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => toast.success("Added")} className="p-2 rounded text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
            <button onClick={() => toast.success("Refreshed")} className="p-2 rounded text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {tab === "Activity History" && (
            <>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Activity Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity Types</SelectItem>
                    {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Date" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {DATE_OPTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {grouped.map(([day, items]) => (
                <div key={day} className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">{day}</div>
                  <ol className="relative space-y-3 border-l border-border pl-6">
                    {items.map((a) => (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[31px] top-1 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
                          <GitBranch className="h-3 w-3" />
                        </span>
                        <button
                          onClick={() => setOpenActivity(a)}
                          className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-1 font-medium text-primary">
                            {a.title}
                            <ChevronRight className="h-4 w-4" />
                          </div>
                          {a.detail && <div className="text-sm">{a.detail}</div>}
                          <div className="mt-1 text-xs text-muted-foreground">
                            {a.by === "System" ? "Modified by" : "Added by"} {a.by} · {fmtDateTime(a.at)} · {fmtTimeAgo(a.at)}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              {grouped.length === 0 && <div className="text-sm text-muted-foreground">No activities.</div>}
            </>
          )}

          {tab === "Product Opportunity" && <ProductOppTab opp={opp} />}
          {tab === "Tasks" && <TasksTab />}
          {tab === "Documents" && <DocumentsTab />}
          {tab === "Opportunity Share" && <ShareTab owner={opp.owner} />}
        </div>
      </div>

      {/* right notes */}
      <aside className="hidden xl:flex w-80 shrink-0 flex-col border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <span className="font-semibold">Notes</span>
          <Button size="sm" variant="outline" onClick={addNote}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="p-4 space-y-3 shrink-0 border-b border-border">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Write a note…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {notes.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <StickyNote className="mx-auto h-8 w-8 opacity-40" />
                <p className="mt-2 font-medium">No Notes Found Yet!</p>
                <p className="text-sm">Click 'Add' to save your new notes.</p>
              </div>
            </div>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                {n.text}
                <div className="mt-1 text-xs text-muted-foreground">{fmtDateTime(n.at)}</div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* activity detail drawer */}
      <Drawer open={!!openActivity} onClose={() => setOpenActivity(null)} title={openActivity?.title ?? ""} width="sm">
        {openActivity && (
          <div className="space-y-5">
            {openActivity.detail && <Badge variant="secondary">{openActivity.detail}</Badge>}
            <div className="text-xs text-muted-foreground">
              {openActivity.by === "System" ? "Modified by" : "Added by"} {openActivity.by} · {fmtDateTime(openActivity.at)}
            </div>
            <div className="space-y-4">
              {(openActivity.fields ?? []).map((f) => (
                <div key={f.label}>
                  <div className="text-xs text-muted-foreground">{f.label}</div>
                  <div className="text-sm">
                    {f.value}
                    {f.sub && <span className="ml-2 text-muted-foreground line-through">{f.sub}</span>}
                  </div>
                </div>
              ))}
              {(openActivity.fields ?? []).length === 0 && <div className="text-sm text-muted-foreground">No additional fields.</div>}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tasks tab                                                           */
/* ------------------------------------------------------------------ */

interface Task { id: string; type: string; due: string; owner: string; done: boolean }

function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", type: "Follow-up CALL", due: "2026-06-22T10:00:00", owner: "Viraj Parsekar", done: false },
    { id: "t2", type: "Meeting", due: "2026-06-24T15:30:00", owner: "Anish Mahadaye", done: false },
    { id: "t3", type: "Call back Requested", due: "2026-06-19T11:00:00", owner: "Viraj Parsekar", done: true },
  ]);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState(TASK_TYPES[0].items[0]);
  const [due, setDue] = useState("");
  const [owner, setOwner] = useState(OWNERS[0].name);

  const add = () => {
    setTasks((t) => [{ id: `t${Date.now() % 10000}`, type, due: due || new Date().toISOString(), owner, done: false }, ...t]);
    setAdding(false);
    setDue("");
    toast.success("Task added");
  };
  const toggle = (id: string) => setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const del = (id: string) => { setTasks((t) => t.filter((x) => x.id !== id)); toast.success("Task deleted"); };

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{tasks.filter((t) => !t.done).length} open · {tasks.length} total</span>
        <Button size="sm" onClick={() => setAdding((a) => !a)}><Plus className="h-4 w-4" /> Add Task</Button>
      </div>

      {adding && (
        <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {TASK_TYPES.flatMap((g) => g.items).map((i) => <option key={i}>{i}</option>)}
          </select>
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <div className="flex gap-2">
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm">
              {OWNERS.map((o) => <option key={o.email}>{o.name}</option>)}
            </select>
            <Button size="sm" onClick={add}>Save</Button>
          </div>
        </div>
      )}

      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <button onClick={() => toggle(t.id)} className={t.done ? "text-primary" : "text-muted-foreground"}>
            <CheckCircle2 className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className={"font-medium " + (t.done ? "line-through text-muted-foreground" : "")}>{t.type}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDateTime(t.due)}</span>
              <span>{t.owner}</span>
            </div>
          </div>
          <button onClick={() => del(t.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {tasks.length === 0 && <Empty icon={Clock} text="No tasks yet." />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Documents tab                                                       */
/* ------------------------------------------------------------------ */

function DocumentsTab() {
  const [docs, setDocs] = useState([
    { id: "d1", name: "KYC_Form.pdf", size: "248 KB", by: "Viraj Parsekar", at: "2026-06-16T16:10:00" },
    { id: "d2", name: "PAN_Card.jpg", size: "1.2 MB", by: "Viraj Parsekar", at: "2026-06-15T14:20:00" },
    { id: "d3", name: "Agreement_signed.pdf", size: "512 KB", by: "Anish Mahadaye", at: "2026-06-12T10:00:00" },
  ]);
  const del = (id: string) => { setDocs((d) => d.filter((x) => x.id !== id)); toast.success("Document removed"); };

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setDocs((d) => [{ id: `d${Date.now() % 10000}`, name: "Uploaded_file.pdf", size: "320 KB", by: "LSQ Admin", at: new Date().toISOString() }, ...d]); toast.success("Document uploaded"); }}>
          <Plus className="h-4 w-4" /> Upload
        </Button>
      </div>
      {docs.map((d) => (
        <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{d.name}</div>
            <div className="text-xs text-muted-foreground">{d.size} · {d.by} · {fmtDateTime(d.at)}</div>
          </div>
          <button onClick={() => toast.success(`Downloading ${d.name}`)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"><Download className="h-4 w-4" /></button>
          <button onClick={() => del(d.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {docs.length === 0 && <Empty icon={FileText} text="No documents uploaded." />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Opportunity Share tab                                               */
/* ------------------------------------------------------------------ */

function ShareTab({ owner }: { owner: string }) {
  const [shares, setShares] = useState([
    { id: "s1", user: owner, access: "Owner" },
    { id: "s2", user: "Amar Singh", access: "View & Edit" },
  ]);
  const [user, setUser] = useState(OWNERS[1].name);
  const [access, setAccess] = useState("View");

  const add = () => {
    if (shares.some((s) => s.user === user)) { toast.error("Already shared"); return; }
    setShares((s) => [...s, { id: `s${Date.now() % 10000}`, user, access }]);
    toast.success(`Shared with ${user}`);
  };
  const revoke = (id: string) => { setShares((s) => s.filter((x) => x.id !== id)); toast.success("Access revoked"); };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs text-muted-foreground mb-1">User</div>
          <select value={user} onChange={(e) => setUser(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {OWNERS.map((o) => <option key={o.email}>{o.name}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <div className="text-xs text-muted-foreground mb-1">Access</div>
          <select value={access} onChange={(e) => setAccess(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {["View", "View & Edit", "Full"].map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <Button onClick={add}><Share2 className="h-4 w-4" /> Share</Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-3 py-3 font-medium">User</th>
            <th className="px-3 py-3 font-medium">Access</th>
            <th className="px-3 py-3 font-medium text-right">Action</th>
          </tr></thead>
          <tbody>
            {shares.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-3 py-3">{s.user}</td>
                <td className="px-3 py-3"><Badge variant="secondary">{s.access}</Badge></td>
                <td className="px-3 py-3 text-right">
                  {s.access === "Owner" ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <button onClick={() => revoke(s.id)} className="text-destructive hover:underline text-xs">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="grid place-items-center py-16 text-center text-muted-foreground">
      <div>
        <Icon className="mx-auto h-8 w-8 opacity-40" />
        <p className="mt-2 text-sm">{text}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product Opportunity tab — full details                              */
/* ------------------------------------------------------------------ */

function ProductOppTab({ opp }: { opp: (typeof OPPS)[number] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    details: true, subscription: true, smc: true, stage: true, attempts: true, additional: true,
  });
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="space-y-4 max-w-4xl">
      <Collapsible title="Opportunity Details" open={open.details} onToggle={() => toggle("details")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
          <Field k="Associated Contact" link={`/contacts/${opp.id}`} v={opp.contactName} />
          <Field k="Opportunity Name" v={opp.name} />
          <Field k="Source Name" v={opp.source} />
          <Field k="Campaign" v="--" />
          <Field k="Medium" v="--" />
          <Field k="Term" v="--" />
        </div>
        <Divider />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
          <Field k="DIY Flag" v={opp.diyFlag} />
          <Field k="Call Status" v={opp.callStatus} />
        </div>
        <Divider />
        <div className="p-4 space-y-3">
          <div className="text-sm font-medium">Status</div>
          <Inline k="Status" v={opp.status.split(" - ")[0]} />
          <Inline k="Stage" v={opp.stage} />
        </div>
        <Divider />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
          <Field k="Owner Email ID" v={opp.ownerEmail} />
          <Field k="Owner" v={opp.owner} />
          <Field k="Notes" v="Opportunity capture api overwrite" />
          <Field k="Owner update" v={opp.ownerUpdate} />
        </div>
      </Collapsible>

      <Collapsible title="Subscription" open={open.subscription} onToggle={() => toggle("subscription")}>
        <div className="p-4"><Inline k="Plan current status" v="Pending" /></div>
      </Collapsible>

      <Collapsible title="SMC Product" open={open.smc} onToggle={() => toggle("smc")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
          <Field k="Broad Product" v={opp.broadProduct} />
          <Field k="Sub Product" v={opp.broadProduct} />
          <Field k="Company" v={opp.company} />
          <Field k="Lead Type" v="B2C" />
        </div>
      </Collapsible>

      <Collapsible title="Stage Transition Date Time" open={open.stage} onToggle={() => toggle("stage")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
          <Field k="Agent Assigned Date" v={fmtDateTime(opp.agentAssigned)} />
          <Field k="Stage Not Connected Date Time" v="06/16/2026 04:16:04 PM" />
          <Field k="Stage Need Some Time Date Time" v="06/12/2026 10:36:01 AM" />
        </div>
      </Collapsible>

      <Collapsible title="Attempts and Connects Tracking" open={open.attempts} onToggle={() => toggle("attempts")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
          <Field k="First Attempt Date Time" v={fmtDateTime(opp.createdOn)} />
          <Field k="Last Attempt Date Time" v={fmtDateTime(opp.createdOn)} />
          <Field k="No of Connects" v={String(opp.noOfConnects)} />
          <Field k="No of Attempts" v={String(opp.noOfAttempts)} />
        </div>
      </Collapsible>

      <Collapsible title="Additional Details" open={open.additional} onToggle={() => toggle("additional")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4">
          <Field k="Created By" v="LSQ Admin" />
          <Field k="Created On" v={fmtDateTime(opp.createdOn)} />
          <Field k="Modified By" v="System" />
          <Field k="Modified On" v={opp.ownerUpdate} />
        </div>
      </Collapsible>
    </div>
  );
}

function Collapsible({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 font-semibold hover:bg-secondary/40">
        {title}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

function Field({ k, v, link }: { k: string; v: string; link?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      {link ? (
        <Link href={link} className="text-sm text-primary hover:underline">{v}</Link>
      ) : (
        <div className="text-sm break-words">{v}</div>
      )}
    </div>
  );
}

function Inline({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="w-28 text-muted-foreground">{k}:</span>
      <span>{v}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RowKV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-sm break-words">{v}</div>
    </div>
  );
}
