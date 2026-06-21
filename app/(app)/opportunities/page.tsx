"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  RefreshCw,
  Edit2,
  Copy,
  CalendarPlus,
  MoreVertical,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Pin,
  Settings2,
  GitBranch,
  Activity as ActivityIcon,
  StickyNote,
  CheckSquare,
  Mail,
  ExternalLink,
  Trash2,
  UserCog,
  ArrowRightLeft,
} from "lucide-react";
import {
  OPPS,
  OWNERS,
  STATUSES,
  STAGES,
  Opp,
  fmtDateTime,
} from "@/components/opportunities/opp-data";
import {
  AddOpportunityDrawer,
  AddTaskDrawer,
  EditOpportunityDrawer,
} from "@/components/opportunities/opp-forms";
import { Drawer } from "@/components/opportunities/drawer";

const TYPES = [
  { id: "IIBX", label: "IIBX" },
  { id: "Product Opportunity", label: "Product Opportunity" },
] as const;

const FILTER_FIELDS = ["Status", "Owner", "Agent Assigned Date", "Created On", "DIY Flag"];
const OTHER_FILTERS = ["Contact Stage", "Stage"];

// Configurable table columns (Name + Actions are always shown).
type ColDef = { key: string; label: string; align?: "right"; muted?: boolean; cell: (o: Opp) => React.ReactNode };
const COLUMN_DEFS: ColDef[] = [
  { key: "createdOn", label: "Created On", muted: true, cell: (o) => fmtDateTime(o.createdOn) },
  { key: "agentAssigned", label: "Agent Assigned", muted: true, cell: (o) => fmtDateTime(o.agentAssigned) },
  { key: "noOfAttempts", label: "No of Attempts", align: "right", cell: (o) => o.noOfAttempts },
  { key: "ownerUpdate", label: "Owner update", muted: true, cell: (o) => o.ownerUpdate },
  { key: "owner", label: "Owner", cell: (o) => o.owner },
  { key: "status", label: "Status", cell: (o) => o.status },
  { key: "stage", label: "Stage", cell: (o) => o.stage },
  { key: "broadProduct", label: "Broad Product", muted: true, cell: (o) => o.broadProduct },
  { key: "company", label: "Company", cell: (o) => o.company },
  { key: "noOfConnects", label: "No of Connects", align: "right", cell: (o) => o.noOfConnects },
  { key: "diyFlag", label: "DIY Flag", cell: (o) => o.diyFlag },
  { key: "phone", label: "Phone", muted: true, cell: (o) => o.phone },
  { key: "email", label: "Email", muted: true, cell: (o) => o.email },
];
const DEFAULT_COLS = ["createdOn", "agentAssigned", "noOfAttempts", "ownerUpdate", "owner"];
// Contact-tab fields are cosmetic (reference parity) — toggling them just persists the choice.
const CONTACT_FIELDS = ["Call Back", "camp_name", "Channel source", "City", "Contact Created On", "Contact Modified On", "Contact Owner", "Contact Source", "Contact Stage", "Country", "Customer Tier", "Date Of Birth"];

export default function OpportunitiesPage() {
  const [opps, setOpps] = useState<Opp[]>(OPPS);
  const [activeType, setActiveType] = useState<(typeof TYPES)[number]["id"]>("Product Opportunity");

  // filters
  const [search, setSearch] = useState("");
  const [upsale, setUpsale] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [diyFilter, setDiyFilter] = useState<Set<string>>(new Set());
  // cosmetic display chips (removable) — mirror reference's saved filters
  const [chips, setChips] = useState({ advanced: true, agentAssigned: true, createdOn: true });

  // selection + pagination
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  // drawers / dialogs
  const [adding, setAdding] = useState(false);
  const [editTarget, setEditTarget] = useState<Opp | null>(null);
  const [taskTarget, setTaskTarget] = useState<Opp | null>(null);
  const [preview, setPreview] = useState<Opp | null>(null);
  const [ownerDialog, setOwnerDialog] = useState<Opp | null>(null);
  const [statusDialog, setStatusDialog] = useState<Opp | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Opp | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLS);

  const cols = visibleCols
    .map((k) => COLUMN_DEFS.find((c) => c.key === k))
    .filter(Boolean) as ColDef[];

  /* derived */
  const filtered = useMemo(() => {
    return opps.filter((o) => {
      if (o.type !== activeType) return false;
      if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (upsale !== "all" && o.upsale !== upsale) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (ownerFilter !== "all" && o.owner !== ownerFilter) return false;
      if (diyFilter.size && !diyFilter.has(o.diyFlag)) return false;
      return true;
    });
  }, [opps, activeType, search, upsale, statusFilter, ownerFilter, diyFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  /* helpers */
  const toggleRow = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPageSelected) pageRows.forEach((r) => n.delete(r.id));
      else pageRows.forEach((r) => n.add(r.id));
      return n;
    });
  const toggleDiy = (v: string) =>
    setDiyFilter((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      setPage(1);
      return n;
    });

  const clearFilters = () => {
    setSearch("");
    setUpsale("all");
    setStatusFilter("all");
    setOwnerFilter("all");
    setDiyFilter(new Set());
    setChips({ advanced: false, agentAssigned: false, createdOn: false });
    setPage(1);
  };

  const hasFilters =
    search || upsale !== "all" || statusFilter !== "all" || ownerFilter !== "all" || diyFilter.size ||
    chips.advanced || chips.agentAssigned || chips.createdOn;

  const removeOpp = (id: string) => {
    setOpps((o) => o.filter((x) => x.id !== id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    if (preview?.id === id) setPreview(null);
  };

  /* ---------------------------------------------------------------- */
  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      {/* left type rail */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="px-4 py-4 text-sm font-semibold text-muted-foreground border-b border-border">
          Opportunity Types
        </div>
        <nav className="p-2 space-y-1">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveType(t.id);
                setPage(1);
                setSelected(new Set());
              }}
              className={
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors " +
                (activeType === t.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground")
              }
            >
              <GitBranch className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* main */}
      <div className="flex flex-1 min-w-0 flex-col p-4 md:p-6 gap-4">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <GitBranch className="h-6 w-6 text-primary" />
            {activeType}
            <button
              onClick={() => toast.success("Refreshed")}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add Opportunity
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.success("Exported (CSV)")}>Export</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success("Bulk update opened")}>Bulk update</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* filter bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search here" className="pl-9" />
          </div>

          {/* Upsale */}
          <Select value={upsale} onValueChange={(v) => { setUpsale(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] text-emerald-600"><SelectValue placeholder="Upsale" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Upsale">Upsale</SelectItem>
              <SelectItem value="New">New</SelectItem>
            </SelectContent>
          </Select>

          {/* +Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="bg-primary/90"><Filter className="h-4 w-4" /> Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <div className="px-2 pb-2">
                <Input placeholder="Search here" className="h-9" />
              </div>
              {FILTER_FIELDS.map((f) => (
                <DropdownMenuItem key={f} onClick={() => toast.success(`Filter: ${f}`)} className="justify-between">
                  {f}
                  <Pin className="h-3.5 w-3.5 text-primary" />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Other Filters</DropdownMenuLabel>
              {OTHER_FILTERS.map((f) => (
                <DropdownMenuItem key={f} onClick={() => toast.success(`Filter: ${f}`)}>{f}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-primary justify-center" onClick={() => toast.success("Edit Advanced Filters")}>
                <Edit2 className="h-4 w-4" /> Edit Advanced Filters
              </DropdownMenuItem>
              <DropdownMenuItem className="justify-center" onClick={() => setConfigOpen(true)}>
                <Settings2 className="h-4 w-4" /> Configure Fields
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* chips */}
          {chips.advanced && (
            <Chip label="Advanced" value="Added" onRemove={() => setChips((c) => ({ ...c, advanced: false }))} />
          )}

          {/* Status chip */}
          <ChipSelect
            label="Status"
            value={statusFilter === "all" ? "Open" : statusFilter}
            options={STATUSES}
            active={statusFilter !== "all"}
            onSelect={(v) => { setStatusFilter(v); setPage(1); }}
            onRemove={() => { setStatusFilter("all"); setPage(1); }}
          />

          {/* Owner chip */}
          <ChipSelect
            label="Owner"
            value={ownerFilter === "all" ? "" : ownerFilter}
            options={OWNERS.map((o) => o.name)}
            active={ownerFilter !== "all"}
            onSelect={(v) => { setOwnerFilter(v); setPage(1); }}
            onRemove={() => { setOwnerFilter("all"); setPage(1); }}
          />

          {chips.agentAssigned && (
            <Chip label="Agent Assi..." value="This Month" onRemove={() => setChips((c) => ({ ...c, agentAssigned: false }))} />
          )}
          {chips.createdOn && (
            <Chip label="Created On" value="" onRemove={() => setChips((c) => ({ ...c, createdOn: false }))} />
          )}

          {/* DIY Flag */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-normal">
                DIY Flag {diyFilter.size > 0 && <Badge variant="secondary" className="ml-1">{diyFilter.size}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {["Yes", "No"].map((v) => (
                <label key={v} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-secondary rounded-sm">
                  <Checkbox checked={diyFilter.has(v)} onCheckedChange={() => toggleDiy(v)} />
                  {v}
                </label>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={clearFilters}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          )}

          {selected.size > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">{selected.size} selected</span>
          )}
        </div>

        {/* table */}
        <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="w-10 px-3 py-3"><Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} /></th>
                  <th className="px-3 py-3 font-medium min-w-[180px]">Opportunity Name</th>
                  <th className="px-3 py-3 font-medium text-center w-[150px]">Actions</th>
                  {cols.map((c) => (
                    <th key={c.key} className={"px-3 py-3 font-medium whitespace-nowrap " + (c.align === "right" ? "text-right" : "")}>{c.label}</th>
                  ))}
                  <th className="w-10 px-2 py-3 text-right">
                    <button onClick={() => setConfigOpen(true)} title="Configure Fields" className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary">
                      <Settings2 className="h-4 w-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => (
                  <tr
                    key={o.id}
                    className={
                      "border-b border-border last:border-0 hover:bg-secondary/40 transition-colors " +
                      (preview?.id === o.id ? "bg-primary/5" : "")
                    }
                  >
                    <td className="px-3 py-3"><Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggleRow(o.id)} /></td>
                    <td className="px-3 py-3">
                      <button onClick={() => setPreview(o)} className="font-medium text-primary hover:underline text-left">
                        {o.name}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <IconBtn title="Edit" onClick={() => setEditTarget(o)}><Edit2 className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Add Task" onClick={() => setTaskTarget(o)}><CalendarPlus className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Duplicate" onClick={() => { setOpps((s) => [{ ...o, id: `${o.id}-c`, name: `${o.name} (copy)` }, ...s]); toast.success("Duplicated"); }}><Copy className="h-4 w-4" /></IconBtn>
                        <RowMenu
                          opp={o}
                          onEdit={() => setEditTarget(o)}
                          onAddTask={() => setTaskTarget(o)}
                          onAddActivity={() => toast.success(`Activity added to ${o.name}`)}
                          onChangeOwner={() => setOwnerDialog(o)}
                          onChangeStatus={() => setStatusDialog(o)}
                          onDelete={() => setDeleteTarget(o)}
                        />
                      </div>
                    </td>
                    {cols.map((c) => (
                      <td key={c.key} className={"px-3 py-3 whitespace-nowrap " + (c.align === "right" ? "text-right tabular-nums " : "") + (c.muted ? "text-muted-foreground" : "")}>
                        {c.cell(o)}
                      </td>
                    ))}
                    <td />
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr><td colSpan={cols.length + 4} className="px-3 py-16 text-center text-muted-foreground">No opportunities match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Showing {total === 0 ? 0 : start + 1}-{Math.min(start + pageSize, total)} of {total}</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 200].map((n) => <SelectItem key={n} value={String(n)}>Show {n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button key={p} variant={p === safePage ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => setPage(p)}>{p}</Button>
              ))}
              <Button variant="outline" size="icon" className="h-9 w-9" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- preview drawer ---- */}
      <Drawer open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? ""} width="sm">
        {preview && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="font-medium">{preview.status}</Badge>
              <Link href={`/opportunities/${preview.id}`} className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                <ExternalLink className="h-4 w-4" /> Open
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">{preview.contactName}</div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { icon: ActivityIcon, label: "Activity", fn: () => toast.success("Activity added") },
                { icon: StickyNote, label: "Note", fn: () => toast.success("Note added") },
                { icon: CheckSquare, label: "Tasks", fn: () => setTaskTarget(preview) },
                { icon: Mail, label: "Email", fn: () => toast.success("Email composer") },
              ].map((a) => (
                <button key={a.label} onClick={a.fn} className="flex flex-col items-center gap-1 rounded-md py-3 text-primary hover:bg-secondary transition-colors">
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </button>
              ))}
            </div>

            <Detail title="Details">
              <Row k="Contact Name" v={preview.contactName} />
              <Row k="Opportunity Name" v={preview.name} />
              <Row k="Status" v={preview.status} />
              <Row k="Stage" v={preview.stage} />
              <Row k="Owner" v={preview.owner} />
            </Detail>

            <Detail title="Product Opportunity Properties">
              <Row k="Opportunity ID" v={preview.opportunityId} />
              <Row k="Talisma ID" v={preview.talismaId} />
              <Row k="Broad Product" v={preview.broadProduct} />
              <Row k="Company" v={preview.company} />
            </Detail>

            <Button variant="outline" className="w-full" onClick={() => { setEditTarget(preview); }}>
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          </div>
        )}
      </Drawer>

      {/* ---- add / task / edit drawers ---- */}
      <AddOpportunityDrawer
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(data) => {
          const id = `n-${Date.now() % 100000}`;
          const now = new Date().toISOString().slice(0, 19);
          const owner = OWNERS[0];
          setOpps((s) => [
            {
              id, name: data.name, status: data.status ?? "Open - Not Connected", stage: data.stage ?? "Prospect",
              type: activeType, diyFlag: "No", upsale: "New", createdOn: now, agentAssigned: now,
              noOfAttempts: 0, noOfConnects: 0, ownerUpdate: now.replace("T", " "), owner: owner.name, ownerEmail: owner.email,
              contactName: data.name, phone: data.phone ?? "", email: data.email ?? "", company: data.company ?? "Stoxkart",
              broadProduct: data.broadProduct ?? "STX Trading Account", source: "STX Trading Account", callStatus: "--",
              talismaId: "--", opportunityId: String(16000000 + (Date.now() % 100000)),
            },
            ...s,
          ]);
          setAdding(false);
          setPage(1);
          toast.success(`Created "${data.name}"`);
        }}
      />

      <AddTaskDrawer
        open={!!taskTarget}
        opp={taskTarget}
        onClose={() => setTaskTarget(null)}
        onSave={(t) => { toast.success(`Task "${t.type}" added`); setTaskTarget(null); }}
      />

      <EditOpportunityDrawer
        open={!!editTarget}
        opp={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(patch) => {
          setOpps((s) => s.map((x) => (x.id === editTarget!.id ? { ...x, ...patch } : x)));
          if (preview?.id === editTarget!.id) setPreview({ ...preview, ...patch } as Opp);
          setEditTarget(null);
          toast.success("Saved");
        }}
      />

      {/* ---- change owner dialog ---- */}
      <QuickSelectDialog
        open={!!ownerDialog}
        title="Change Owner"
        icon={<UserCog className="h-5 w-5" />}
        value={ownerDialog?.owner ?? ""}
        options={OWNERS.map((o) => o.name)}
        onClose={() => setOwnerDialog(null)}
        onSave={(v) => {
          setOpps((s) => s.map((x) => (x.id === ownerDialog!.id ? { ...x, owner: v } : x)));
          toast.success(`Owner → ${v}`);
          setOwnerDialog(null);
        }}
      />

      {/* ---- change status dialog ---- */}
      <QuickSelectDialog
        open={!!statusDialog}
        title="Change Status / Stage"
        icon={<ArrowRightLeft className="h-5 w-5" />}
        value={statusDialog?.status ?? ""}
        options={STATUSES}
        secondLabel="Stage"
        secondValue={statusDialog?.stage ?? ""}
        secondOptions={STAGES}
        onClose={() => setStatusDialog(null)}
        onSave={(v, v2) => {
          setOpps((s) => s.map((x) => (x.id === statusDialog!.id ? { ...x, status: v, stage: v2 ?? x.stage } : x)));
          toast.success(`Status → ${v}`);
          setStatusDialog(null);
        }}
      />

      {/* ---- configure filter fields ---- */}
      <ConfigureFieldsModal
        open={configOpen}
        current={visibleCols}
        onClose={() => setConfigOpen(false)}
        onApply={(next) => { setVisibleCols(next); setConfigOpen(false); toast.success("Fields updated"); }}
      />

      {/* ---- delete confirm ---- */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete opportunity?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently remove <span className="font-medium text-foreground">{deleteTarget?.name}</span>. Cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { removeOpp(deleteTarget!.id); toast.success("Deleted"); setDeleteTarget(null); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* sub-components                                                      */
/* ------------------------------------------------------------------ */

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} className="p-1.5 rounded hover:bg-secondary hover:text-foreground transition-colors">
      {children}
    </button>
  );
}

function RowMenu({
  opp, onEdit, onAddActivity, onAddTask, onChangeOwner, onChangeStatus, onDelete,
}: {
  opp: Opp;
  onEdit: () => void;
  onAddActivity: () => void;
  onAddTask: () => void;
  onChangeOwner: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded hover:bg-secondary hover:text-foreground transition-colors" title="More"><MoreHorizontal className="h-4 w-4" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}><Edit2 className="h-4 w-4" /> Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={onAddActivity}><ActivityIcon className="h-4 w-4" /> Add Activity</DropdownMenuItem>
        <DropdownMenuItem onClick={onAddTask}><CalendarPlus className="h-4 w-4" /> Add Task</DropdownMenuItem>
        <DropdownMenuItem onClick={onChangeOwner}><UserCog className="h-4 w-4" /> Change Owner</DropdownMenuItem>
        <DropdownMenuItem onClick={onChangeStatus}><ArrowRightLeft className="h-4 w-4" /> Change Status/Stage</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Chip({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 h-10 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {value && <Badge variant="secondary" className="font-medium">{value}</Badge>}
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
    </span>
  );
}

function ChipSelect({
  label, value, options, active, onSelect, onRemove,
}: {
  label: string;
  value: string;
  options: string[];
  active: boolean;
  onSelect: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card pl-3 pr-1 h-10 text-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2">
            <span className="text-muted-foreground">{label}</span>
            {value && <Badge variant="secondary" className="font-medium">{value}</Badge>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
          {options.map((o) => (
            <DropdownMenuItem key={o} onClick={() => onSelect(o)}>{o}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {active && (
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive p-1"><X className="h-4 w-4" /></button>
      )}
    </span>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  );
}

function ConfigureFieldsModal({
  open, current, onClose, onApply,
}: {
  open: boolean;
  current: string[];
  onClose: () => void;
  onApply: (next: string[]) => void;
}) {
  const [tab, setTab] = useState<"opp" | "contact">("opp");
  const [sel, setSel] = useState<Set<string>>(new Set(current));
  const [contactSel, setContactSel] = useState<Set<string>>(new Set(["Contact Stage"]));
  const [q, setQ] = useState("");
  const [seed, setSeed] = useState(false);
  if (open && !seed) { setSeed(true); setSel(new Set(current)); setQ(""); }
  if (!open && seed) setSeed(false);

  const oppList = COLUMN_DEFS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  const contactList = CONTACT_FIELDS.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
  const count = sel.size + contactSel.size;

  const toggle = (key: string, contact: boolean) => {
    const target = contact ? contactSel : sel;
    const setter = contact ? setContactSel : setSel;
    const n = new Set(target);
    n.has(key) ? n.delete(key) : n.add(key);
    setter(n);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Configure Filter Fields
            <Badge variant="secondary">{count}/30</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search here" className="pl-9" />
        </div>

        <div className="grid grid-cols-2 rounded-md border border-border overflow-hidden text-sm">
          <button onClick={() => setTab("opp")} className={"py-2 " + (tab === "opp" ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/50")}>Product Oppor...</button>
          <button onClick={() => setTab("contact")} className={"py-2 " + (tab === "contact" ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/50")}>Contact</button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {tab === "opp"
            ? oppList.map((c) => (
                <label key={c.key} className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-secondary cursor-pointer text-sm">
                  <Checkbox checked={sel.has(c.key)} onCheckedChange={() => toggle(c.key, false)} />
                  {c.label}
                </label>
              ))
            : contactList.map((c) => (
                <label key={c} className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-secondary cursor-pointer text-sm">
                  <Checkbox checked={contactSel.has(c)} onCheckedChange={() => toggle(c, true)} />
                  {c}
                </label>
              ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setSel(new Set(DEFAULT_COLS)); setContactSel(new Set(["Contact Stage"])); }}>Restore Default</Button>
          <Button onClick={() => onApply(COLUMN_DEFS.filter((c) => sel.has(c.key)).map((c) => c.key))}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuickSelectDialog({
  open, title, icon, value, options, secondLabel, secondValue, secondOptions, onClose, onSave,
}: {
  open: boolean;
  title: string;
  icon: React.ReactNode;
  value: string;
  options: string[];
  secondLabel?: string;
  secondValue?: string;
  secondOptions?: string[];
  onClose: () => void;
  onSave: (v: string, v2?: string) => void;
}) {
  const [v, setV] = useState(value);
  const [v2, setV2] = useState(secondValue ?? "");
  const [seed, setSeed] = useState(false);
  if (open && !seed) { setSeed(true); setV(value); setV2(secondValue ?? ""); }
  if (!open && seed) setSeed(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2">{icon} {title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select value={v} onValueChange={setV}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {secondOptions && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{secondLabel}</label>
              <Select value={v2} onValueChange={setV2}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{secondOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(v, v2)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
