"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Plus,
  FilePlus2,
  RefreshCw,
  Mail,
  Edit2,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Download,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types + dummy data                                                  */
/* ------------------------------------------------------------------ */

type ListType = "Static" | "Dynamic";

interface CrmList {
  id: string;
  name: string;
  memberCount: number;
  type: ListType;
  tag?: string;
  modifiedBy: string;
  modifiedOn: string; // ISO
  createdBy: string;
  createdOn: string; // ISO
  system?: boolean; // system lists cannot be edited/deleted
}

const USERS = [
  { name: "Me (LSQ Admin)", email: "lsqadmin@smcindiaonline.com" },
  { name: "Aarti Naik", email: "aartinaik@stoxkart.com" },
  { name: "Aditya Test", email: "adityagupta@smcindiaonline.com" },
  { name: "Akanksha Gupta", email: "akanksha@smccoins.com" },
  { name: "Akash More", email: "akash.more@stoxkart.com" },
  { name: "Akshay Tyagi", email: "akshaytyagi@smcindiaonline.com" },
];

const TAGS = ["Marketing", "Sales", "Retention", "Onboarding", "Untagged"];

const SEED: CrmList[] = [
  { id: "1", name: "Starred Contacts", memberCount: 1, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-03-27T20:54:00", createdBy: "LSQ Admin", createdOn: "2022-02-14T16:38:00", system: true, tag: "Untagged" },
  { id: "2", name: "All Contacts", memberCount: 808184, type: "Dynamic", modifiedBy: "System", modifiedOn: "2022-02-14T16:38:00", createdBy: "System", createdOn: "2022-02-14T16:38:00", system: true, tag: "Untagged" },
  { id: "3", name: "Test", memberCount: 11, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-11-14T19:46:00", createdBy: "LSQ Admin", createdOn: "2025-11-14T19:46:00", tag: "Sales" },
  { id: "4", name: "No Opp 13-11-2025", memberCount: 0, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-11-14T02:13:00", createdBy: "LSQ Admin", createdOn: "2025-11-13T16:15:00", tag: "Sales" },
  { id: "5", name: "test 01112024", memberCount: 49425, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-11-01T13:03:00", createdBy: "LSQ Admin", createdOn: "2025-11-01T13:03:00", tag: "Marketing" },
  { id: "6", name: "01-11-2025 smc leads", memberCount: 0, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-11-20T02:32:00", createdBy: "LSQ Admin", createdOn: "2025-11-01T12:46:00", tag: "Marketing" },
  { id: "7", name: "No opp for lead", memberCount: 0, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-07-12T02:57:00", createdBy: "LSQ Admin", createdOn: "2025-07-11T15:10:00", tag: "Sales" },
  { id: "8", name: "Lead Without Opp", memberCount: 172473, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-07-09T17:50:00", createdBy: "LSQ Admin", createdOn: "2025-07-09T17:50:00", tag: "Sales" },
  { id: "9", name: "Lead With out Opp", memberCount: 172473, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-07-09T17:41:00", createdBy: "LSQ Admin", createdOn: "2025-07-09T17:41:00", tag: "Sales" },
  { id: "10", name: "Opp SMC - 09-07-2025", memberCount: 60140, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-07-09T12:08:00", createdBy: "LSQ Admin", createdOn: "2025-07-09T12:08:00", tag: "Retention" },
  { id: "11", name: "SMC Opp - 0807-2025", memberCount: 59562, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-07-08T12:45:00", createdBy: "LSQ Admin", createdOn: "2025-07-08T12:45:00", tag: "Retention" },
  { id: "12", name: "Active Traders Q2", memberCount: 23410, type: "Dynamic", modifiedBy: "Aarti Naik", modifiedOn: "2025-06-30T11:20:00", createdBy: "Aarti Naik", createdOn: "2025-06-21T09:00:00", tag: "Retention" },
  { id: "13", name: "Dormant 90d", memberCount: 90211, type: "Dynamic", modifiedBy: "Akash More", modifiedOn: "2025-06-18T15:05:00", createdBy: "Akash More", createdOn: "2025-06-10T10:30:00", tag: "Retention" },
  { id: "14", name: "KYC Pending", memberCount: 4502, type: "Static", modifiedBy: "Akanksha Gupta", modifiedOn: "2025-06-15T18:45:00", createdBy: "Akanksha Gupta", createdOn: "2025-06-12T14:10:00", tag: "Onboarding" },
  { id: "15", name: "Webinar Signups", memberCount: 1320, type: "Static", modifiedBy: "Akshay Tyagi", modifiedOn: "2025-06-09T13:00:00", createdBy: "Akshay Tyagi", createdOn: "2025-06-05T16:20:00", tag: "Marketing" },
  { id: "16", name: "High Value Clients", memberCount: 870, type: "Dynamic", modifiedBy: "Aditya Test", modifiedOn: "2025-05-29T09:40:00", createdBy: "Aditya Test", createdOn: "2025-05-20T11:00:00", tag: "Sales" },
  { id: "17", name: "Churned 2025", memberCount: 15600, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-05-18T12:15:00", createdBy: "LSQ Admin", createdOn: "2025-05-10T08:30:00", tag: "Retention" },
  { id: "18", name: "Newsletter Optins", memberCount: 220140, type: "Dynamic", modifiedBy: "Akshay Tyagi", modifiedOn: "2025-05-12T17:00:00", createdBy: "Akshay Tyagi", createdOn: "2025-05-01T10:00:00", tag: "Marketing" },
  { id: "19", name: "Demo Requested", memberCount: 640, type: "Static", modifiedBy: "Aarti Naik", modifiedOn: "2025-04-28T14:25:00", createdBy: "Aarti Naik", createdOn: "2025-04-20T09:15:00", tag: "Sales" },
  { id: "20", name: "Trial Expiring 7d", memberCount: 312, type: "Dynamic", modifiedBy: "Akanksha Gupta", modifiedOn: "2025-04-22T11:50:00", createdBy: "Akanksha Gupta", createdOn: "2025-04-15T13:40:00", tag: "Onboarding" },
  { id: "21", name: "Referral Program", memberCount: 5400, type: "Static", modifiedBy: "Akash More", modifiedOn: "2025-04-10T16:30:00", createdBy: "Akash More", createdOn: "2025-04-02T10:10:00", tag: "Marketing" },
  { id: "22", name: "Enterprise Leads", memberCount: 142, type: "Static", modifiedBy: "Aditya Test", modifiedOn: "2025-03-30T09:00:00", createdBy: "Aditya Test", createdOn: "2025-03-22T15:00:00", tag: "Sales" },
  { id: "23", name: "Mobile App Users", memberCount: 410230, type: "Dynamic", modifiedBy: "LSQ Admin", modifiedOn: "2025-03-19T12:40:00", createdBy: "LSQ Admin", createdOn: "2025-03-10T11:20:00", tag: "Untagged" },
  { id: "24", name: "Cold Leads Sweep", memberCount: 88012, type: "Static", modifiedBy: "Aarti Naik", modifiedOn: "2025-03-08T10:05:00", createdBy: "Aarti Naik", createdOn: "2025-03-01T09:30:00", tag: "Sales" },
  { id: "25", name: "VIP Segment", memberCount: 320, type: "Dynamic", modifiedBy: "Akanksha Gupta", modifiedOn: "2025-02-26T14:50:00", createdBy: "Akanksha Gupta", createdOn: "2025-02-18T16:00:00", tag: "Retention" },
  { id: "26", name: "Unverified Emails", memberCount: 60410, type: "Static", modifiedBy: "Akshay Tyagi", modifiedOn: "2025-02-15T11:10:00", createdBy: "Akshay Tyagi", createdOn: "2025-02-08T10:45:00", tag: "Onboarding" },
  { id: "27", name: "Q1 Campaign Target", memberCount: 99820, type: "Static", modifiedBy: "Akash More", modifiedOn: "2025-02-04T09:25:00", createdBy: "Akash More", createdOn: "2025-01-28T13:15:00", tag: "Marketing" },
  { id: "28", name: "Reactivation Wave", memberCount: 27410, type: "Dynamic", modifiedBy: "Aditya Test", modifiedOn: "2025-01-22T15:35:00", createdBy: "Aditya Test", createdOn: "2025-01-14T10:00:00", tag: "Retention" },
  { id: "29", name: "Survey Respondents", memberCount: 1890, type: "Static", modifiedBy: "LSQ Admin", modifiedOn: "2025-01-12T12:00:00", createdBy: "LSQ Admin", createdOn: "2025-01-05T09:50:00", tag: "Marketing" },
  { id: "30", name: "Partner Network", memberCount: 76, type: "Static", modifiedBy: "Aarti Naik", modifiedOn: "2024-12-28T14:15:00", createdBy: "Aarti Naik", createdOn: "2024-12-20T11:30:00", tag: "Sales" },
  { id: "31", name: "Onboarding Day 1", memberCount: 5012, type: "Dynamic", modifiedBy: "Akanksha Gupta", modifiedOn: "2024-12-15T10:40:00", createdBy: "Akanksha Gupta", createdOn: "2024-12-08T09:00:00", tag: "Onboarding" },
  { id: "32", name: "Bounced Contacts", memberCount: 33210, type: "Static", modifiedBy: "Akshay Tyagi", modifiedOn: "2024-12-04T16:55:00", createdBy: "Akshay Tyagi", createdOn: "2024-11-26T13:20:00", tag: "Untagged" },
  { id: "33", name: "Black Friday 2024", memberCount: 412900, type: "Static", modifiedBy: "Akash More", modifiedOn: "2024-11-22T09:10:00", createdBy: "Akash More", createdOn: "2024-11-15T08:00:00", tag: "Marketing" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

type SortKey = "name" | "memberCount" | "modifiedOn" | "createdOn";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ListsPage() {
  const [lists, setLists] = useState<CrmList[]>(SEED);

  // filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ListType>("all");
  const [createdByFilter, setCreatedByFilter] = useState<string>("all");
  const [createdBySearch, setCreatedBySearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // sort
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "modifiedOn",
    dir: "desc",
  });

  // selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // pagination
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  // dialogs
  const [editing, setEditing] = useState<CrmList | null>(null);
  const [creating, setCreating] = useState<null | { empty: boolean }>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* derived: filter + sort */
  const filtered = useMemo(() => {
    let rows = lists.filter((l) => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (createdByFilter !== "all" && l.createdBy !== createdByFilter) return false;
      if (tagFilter !== "all" && l.tag !== tagFilter) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      if (sort.key === "memberCount") return (a.memberCount - b.memberCount) * dir;
      return (new Date(a[sort.key]).getTime() - new Date(b[sort.key]).getTime()) * dir;
    });
    return rows;
  }, [lists, search, typeFilter, createdByFilter, tagFilter, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  /* actions */
  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const toggleRow = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAllOnPage = () =>
    setSelected((s) => {
      const next = new Set(s);
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });

  const doDelete = (id: string) => {
    const row = lists.find((l) => l.id === id);
    setLists((ls) => ls.filter((l) => l.id !== id));
    setSelected((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
    setDeleteId(null);
    toast.success(`Deleted "${row?.name}"`);
  };

  const bulkDelete = () => {
    const removable = lists.filter((l) => selected.has(l.id) && !l.system);
    setLists((ls) => ls.filter((l) => !selected.has(l.id) || l.system));
    setSelected(new Set());
    toast.success(`Deleted ${removable.length} list(s)`);
  };

  const duplicate = (row: CrmList) => {
    const copy: CrmList = {
      ...row,
      id: `${row.id}-copy-${row.name.length}`,
      name: `${row.name} (copy)`,
      system: false,
      memberCount: row.memberCount,
    };
    setLists((ls) => [copy, ...ls]);
    toast.success(`Duplicated "${row.name}"`);
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCreatedByFilter("all");
    setCreatedBySearch("");
    setTagFilter("all");
    setPage(1);
  };

  const hasFilters =
    search || typeFilter !== "all" || createdByFilter !== "all" || tagFilter !== "all";

  const filteredUsers = USERS.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(createdBySearch.toLowerCase())
  );

  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen p-4 md:p-6 gap-4 overflow-hidden">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Manage Lists</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCreating({ empty: true })}>
            <FilePlus2 className="h-4 w-4" /> Add Empty List
          </Button>
          <Button onClick={() => setCreating({ empty: false })}>
            <Plus className="h-4 w-4" /> Add List
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => toast.success("Exported list catalog (CSV)")}>
                <Download className="h-4 w-4" /> Export all
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={selected.size === 0}
                onClick={bulkDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete selected ({selected.size})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search here"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* List Type */}
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as "all" | ListType);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="List Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Static">Static</SelectItem>
            <SelectItem value="Dynamic">Dynamic</SelectItem>
          </SelectContent>
        </Select>

        {/* Created By — searchable dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[170px] justify-between font-normal">
              <span className="truncate">
                {createdByFilter === "all" ? "Created By" : createdByFilter}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 p-0">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search here"
                  value={createdBySearch}
                  onChange={(e) => setCreatedBySearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <DropdownMenuItem
                onClick={() => {
                  setCreatedByFilter("all");
                  setPage(1);
                }}
              >
                All users
              </DropdownMenuItem>
              {filteredUsers.map((u) => {
                const label = u.name.startsWith("Me") ? "LSQ Admin" : u.name;
                return (
                  <DropdownMenuItem
                    key={u.email}
                    onClick={() => {
                      setCreatedByFilter(label);
                      setPage(1);
                    }}
                    className="flex-col items-start gap-0"
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </DropdownMenuItem>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No users found
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tag */}
        <Select
          value={tagFilter}
          onValueChange={(v) => {
            setTagFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {TAGS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}

        {selected.size > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {selected.size} selected
          </span>
        )}
      </div>

      {/* table */}
      <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="w-10 px-3 py-3">
                  <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAllOnPage} />
                </th>
                <SortableTh
                  label="List Name"
                  active={sort.key === "name"}
                  dir={sort.dir}
                  onClick={() => toggleSort("name")}
                />
                <SortableTh
                  label="Member Count"
                  active={sort.key === "memberCount"}
                  dir={sort.dir}
                  onClick={() => toggleSort("memberCount")}
                />
                <th className="px-3 py-3 font-medium">List Type</th>
                <th className="px-3 py-3 font-medium text-center">Actions</th>
                <th className="px-3 py-3 font-medium">Modified By</th>
                <SortableTh
                  label="Modified On"
                  active={sort.key === "modifiedOn"}
                  dir={sort.dir}
                  onClick={() => toggleSort("modifiedOn")}
                />
                <th className="px-3 py-3 font-medium">Created By</th>
                <SortableTh
                  label="Created On"
                  active={sort.key === "createdOn"}
                  dir={sort.dir}
                  onClick={() => toggleSort("createdOn")}
                />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                >
                  <td className="px-3 py-3">
                    <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggleRow(l.id)} />
                  </td>
                  <td className="px-3 py-3 font-medium whitespace-nowrap">{l.name}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {l.memberCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={l.type === "Dynamic" ? "default" : "secondary"}
                      className="font-medium"
                    >
                      {l.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <IconBtn title="Send email" onClick={() => toast.success(`Email campaign to "${l.name}"`)}>
                        <Mail className="h-4 w-4" />
                      </IconBtn>
                      {!l.system && (
                        <>
                          <IconBtn title="Edit" onClick={() => setEditing(l)}>
                            <Edit2 className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn title="Delete" onClick={() => setDeleteId(l.id)}>
                            <Trash2 className="h-4 w-4" />
                          </IconBtn>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded hover:bg-secondary hover:text-foreground transition-colors"
                            title="More"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => duplicate(l)}>
                            <Copy className="h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success(`Exported "${l.name}"`)}>
                            <Download className="h-4 w-4" /> Export members
                          </DropdownMenuItem>
                          {!l.system && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(l.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{l.modifiedBy}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(l.modifiedOn)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{l.createdBy}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(l.createdOn)}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-16 text-center text-muted-foreground">
                    No lists match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing {total === 0 ? 0 : start + 1}-{Math.min(start + pageSize, total)} of {total}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Show {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === safePage ? "default" : "outline"}
                size="icon"
                className="h-9 w-9"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* edit dialog */}
      <ListDialog
        open={!!editing}
        initial={editing}
        title="Edit List"
        onClose={() => setEditing(null)}
        onSave={(data) => {
          setLists((ls) => ls.map((l) => (l.id === editing!.id ? { ...l, ...data } : l)));
          setEditing(null);
          toast.success(`Updated "${data.name}"`);
        }}
      />

      {/* create dialog */}
      <ListDialog
        open={!!creating}
        initial={null}
        forceType={creating?.empty ? "Static" : undefined}
        title={creating?.empty ? "Add Empty List" : "Add List"}
        onClose={() => setCreating(null)}
        onSave={(data) => {
          const id = `new-${Date.now() % 100000}`;
          const now = new Date().toISOString();
          setLists((ls) => [
            {
              id,
              name: data.name,
              type: data.type,
              tag: data.tag,
              memberCount: creating?.empty ? 0 : Math.floor(data.name.length * 137),
              modifiedBy: "LSQ Admin",
              modifiedOn: now,
              createdBy: "LSQ Admin",
              createdOn: now,
            },
            ...ls,
          ]);
          setCreating(null);
          setPage(1);
          toast.success(`Created "${data.name}"`);
        }}
      />

      {/* delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete list?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {lists.find((l) => l.id === deleteId)?.name}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteId && doDelete(deleteId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-3 font-medium">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </th>
  );
}

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-secondary hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

function ListDialog({
  open,
  initial,
  title,
  forceType,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: CrmList | null;
  title: string;
  forceType?: ListType;
  onClose: () => void;
  onSave: (data: { name: string; type: ListType; tag: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ListType>("Static");
  const [tag, setTag] = useState("Untagged");

  // sync form when opened
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName(initial?.name ?? "");
      setType(forceType ?? initial?.type ?? "Static");
      setTag(initial?.tag ?? "Untagged");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Configure the list details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">List Name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Hot Leads"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">List Type</label>
              <Select value={type} onValueChange={(v) => setType(v as ListType)} disabled={!!forceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Static">Static</SelectItem>
                  <SelectItem value="Dynamic">Dynamic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tag</label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), type, tag })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
