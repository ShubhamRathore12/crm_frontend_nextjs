"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLead, useLeadInvalidators } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { animateFadeUp, animateCardsIn } from "@/lib/animations";
import { LeadScoringCard } from "@/components/leads/lead-scoring-card";
import { EmailCallLogger } from "@/components/interactions/email-call-logger";
import { UnifiedTimeline } from "@/components/activity/unified-timeline";
import {
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Mail,
  Phone,
  MoreHorizontal,
  Star,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Target,
  CheckCircle2,
  Circle,
  FileText,
  Activity,
  Users,
  Share2,
  Megaphone,
  ScrollText,
  Edit2,
  Trash2,
  Copy,
  AlertCircle,
  Flame,
  Calendar,
  Clock,
  Building2,
  TrendingUp,
  Download,
  Eye,
  MousePointerClick,
  Send,
  CheckCheck,
  PhoneCall,
  ListChecks,
  Inbox,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────  Skeleton  ───────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="h-72 rounded-2xl animate-shimmer" />
          <div className="h-40 rounded-2xl animate-shimmer" />
          <div className="h-48 rounded-2xl animate-shimmer" />
        </div>
        <div className="space-y-4">
          <div className="h-12 rounded-xl animate-shimmer" />
          <div className="h-[480px] rounded-2xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  Tab configuration  ──────────────────────── */

const TABS = [
  { key: "opportunities", label: "Opportunities", icon: Target },
  { key: "activity", label: "Activity History", icon: Activity },
  { key: "details", label: "Contact Details", icon: FileText },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "lists", label: "Member of Lists", icon: Users },
  { key: "shares", label: "Contact Share Hist.", icon: Share2 },
  { key: "campaigns", label: "Campaign Emails", icon: Megaphone },
  { key: "audit", label: "Audit Trail", icon: ScrollText },
] as const;

/* ───────────  Per-tab filter & sort definitions  ─────────── */
// Drives the Filter button (status/category) and the Sort dropdown in the tab
// toolbar. `searchText` is what the search box matches against. Each tab keeps
// "all" as its default filter and its first sort entry as the default sort.

type ToolbarConfig = {
  searchText: (i: any) => string;
  filters: { label: string; value: string; test: (i: any) => boolean }[];
  sorts: { label: string; value: string; cmp: (a: any, b: any) => number }[];
};

const priorityRank = (p: string) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
const byStr = (sel: (i: any) => string, dir: 1 | -1 = 1) => (a: any, b: any) =>
  dir * String(sel(a)).localeCompare(String(sel(b)));
const byNum = (sel: (i: any) => number, dir: 1 | -1 = 1) => (a: any, b: any) =>
  dir * (sel(a) - sel(b));

const TAB_TOOLBAR: Record<string, ToolbarConfig> = {
  opportunities: {
    searchText: (o) => `${o.name} ${o.type} ${o.owner}`,
    filters: [
      { label: "All Opportunities", value: "all", test: () => true },
      { label: "Open", value: "open", test: (o) => o.status === "Open" },
      { label: "Won", value: "won", test: (o) => o.status === "Won" },
    ],
    sorts: [
      { label: "Close date (newest)", value: "close", cmp: byStr((o) => o.close, -1) },
      { label: "Amount (high → low)", value: "amount", cmp: byNum((o) => Number(o.amount), -1) },
      { label: "Name (A → Z)", value: "name", cmp: byStr((o) => o.name) },
    ],
  },
  activity: {
    searchText: (a) => `${a.title} ${a.desc} ${a.by}`,
    filters: [
      { label: "All Activities", value: "all", test: () => true },
      { label: "Calls", value: "call", test: (a) => a.type === "call" },
      { label: "Emails", value: "email", test: (a) => a.type === "email" },
      { label: "Page views", value: "page", test: (a) => a.type === "page" },
      { label: "Status changes", value: "status", test: (a) => a.type === "status" },
      { label: "Tasks", value: "task", test: (a) => a.type === "task" },
    ],
    sorts: [
      { label: "Default order", value: "default", cmp: () => 0 },
      { label: "Title (A → Z)", value: "title", cmp: byStr((a) => a.title) },
    ],
  },
  tasks: {
    searchText: (t) => `${t.subject} ${t.owner}`,
    filters: [
      { label: "All Tasks", value: "all", test: () => true },
      { label: "Open", value: "open", test: (t) => !t.completed },
      { label: "Completed", value: "completed", test: (t) => t.completed },
      { label: "High priority", value: "high", test: (t) => t.priority === "high" },
    ],
    sorts: [
      { label: "Due date", value: "due", cmp: byStr((t) => t.dueDate) },
      { label: "Priority (high first)", value: "priority", cmp: byNum((t) => priorityRank(t.priority), -1) },
      { label: "Subject (A → Z)", value: "subject", cmp: byStr((t) => t.subject) },
    ],
  },
  documents: {
    searchText: (d) => `${d.name} ${d.type}`,
    filters: [
      { label: "All Documents", value: "all", test: () => true },
      { label: "PDF", value: "pdf", test: (d) => d.type === "PDF" },
      { label: "Word", value: "docx", test: (d) => d.type === "DOCX" },
      { label: "Images", value: "img", test: (d) => ["PNG", "JPG", "JPEG"].includes(d.type) },
    ],
    sorts: [
      { label: "Date (newest)", value: "date", cmp: byStr((d) => d.date, -1) },
      { label: "Name (A → Z)", value: "name", cmp: byStr((d) => d.name) },
    ],
  },
  lists: {
    searchText: (l) => `${l.name} ${l.type}`,
    filters: [
      { label: "All Lists", value: "all", test: () => true },
      { label: "Static", value: "static", test: (l) => l.type === "Static" },
      { label: "Dynamic", value: "dynamic", test: (l) => l.type === "Dynamic" },
    ],
    sorts: [
      { label: "Members (high → low)", value: "count", cmp: byNum((l) => Number(l.count), -1) },
      { label: "Name (A → Z)", value: "name", cmp: byStr((l) => l.name) },
      { label: "Date added (newest)", value: "date", cmp: byStr((l) => l.date, -1) },
    ],
  },
  shares: {
    searchText: (s) => `${s.with} ${s.by} ${s.level}`,
    filters: [
      { label: "All Shares", value: "all", test: () => true },
      { label: "Edit access", value: "edit", test: (s) => s.level === "Edit" },
      { label: "View access", value: "view", test: (s) => s.level === "View" },
    ],
    sorts: [
      { label: "Date (newest)", value: "date", cmp: byStr((s) => s.date, -1) },
      { label: "Name (A → Z)", value: "with", cmp: byStr((s) => s.with) },
    ],
  },
  campaigns: {
    searchText: (c) => `${c.name} ${c.subject} ${c.status}`,
    filters: [
      { label: "All Campaigns", value: "all", test: () => true },
      { label: "Clicked", value: "clicked", test: (c) => c.status === "Clicked" },
      { label: "Opened", value: "opened", test: (c) => c.status === "Opened" },
      { label: "Delivered", value: "delivered", test: (c) => c.status === "Delivered" },
    ],
    sorts: [
      { label: "Sent date (newest)", value: "sent", cmp: byStr((c) => c.sent, -1) },
      { label: "Campaign (A → Z)", value: "name", cmp: byStr((c) => c.name) },
    ],
  },
  audit: {
    searchText: (a) => `${a.action} ${a.field} ${a.from} ${a.to} ${a.by}`,
    filters: [
      { label: "All Changes", value: "all", test: () => true },
      { label: "Created", value: "created", test: (a) => a.action === "Created" },
      { label: "Updated", value: "updated", test: (a) => a.action === "Updated" },
    ],
    sorts: [
      { label: "Default order", value: "default", cmp: () => 0 },
      { label: "Field (A → Z)", value: "field", cmp: byStr((a) => a.field) },
    ],
  },
};

/* ───────────────────────  Stable dummy generators  ──────────────────── */

function seededRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function buildDummy(lead: any) {
  const id = String(lead?.id ?? "x");
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const rng = seededRng(h || 7);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const owner = pick(["System", "Sales Marketing", "Rahul Verma", "Priya Singh", "Amit Kumar"]);
  const name = lead?.contacts?.name || "this contact";

  return {
    opportunities: [
      { id: 1, name: "Subscription Client", type: "Product Opportunity", owner: "System", status: "Won", stage: "Won", amount: 125000, close: "2026-03-12" },
      { id: 2, name: "Demat Onboarding", type: "Product Opportunity", owner: "System", status: "Won", stage: "Won", amount: 48000, close: "2026-02-28" },
      { id: 3, name: "Portfolio Upsell", type: "Service Opportunity", owner: "Sales Marketing", status: "Open", stage: "Active", amount: 86000, close: "2026-07-04" },
    ],
    activity: [
      { id: 1, type: "call", title: "Outbound call connected", desc: "Discussed mutual fund options · 6 min", time: "2 hours ago", by: owner },
      { id: 2, type: "email", title: "Email opened", desc: "Re: Your portfolio review for Q2", time: "Yesterday", by: "System" },
      { id: 3, type: "page", title: "Visited pricing page", desc: "Spent 3m 12s · 4 pages viewed", time: "2 days ago", by: "Web" },
      { id: 4, type: "status", title: "Stage changed to Qualified", desc: "Auto-qualified by lead score rule", time: "4 days ago", by: "System" },
      { id: 5, type: "task", title: "Task completed", desc: "Send introductory brochure", time: "6 days ago", by: owner },
    ],
    details: {
      "First Name": name.split(" ")[0] || "—",
      "Last Name": name.split(" ").slice(1).join(" ") || "—",
      Email: lead?.contacts?.email || "—",
      Phone: lead?.contacts?.mobile || "—",
      Company: lead?.contacts?.company || "—",
      Designation: pick(["Investor", "Trader", "Business Owner", "Salaried Professional"]),
      City: pick(["New Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad"]),
      State: pick(["Delhi", "Maharashtra", "Karnataka", "Telangana"]),
      Country: "India",
      Source: (lead?.source || "website").replace("_", " "),
      "Product Interest": lead?.product || "—",
      Campaign: lead?.campaign || "—",
    },
    tasks: [
      { id: 1, subject: "Follow-up call on portfolio", dueDate: "2026-06-18", priority: "high", completed: false, owner },
      { id: 2, subject: "Share KYC documents checklist", dueDate: "2026-06-20", priority: "medium", completed: false, owner: "System" },
      { id: 3, subject: "Send welcome kit", dueDate: "2026-06-10", priority: "low", completed: true, owner },
    ],
    documents: [
      { id: 1, name: "KYC_Form_Signed.pdf", type: "PDF", size: "1.2 MB", by: owner, date: "2026-05-22" },
      { id: 2, name: "Portfolio_Proposal.docx", type: "DOCX", size: "640 KB", by: "System", date: "2026-05-30" },
      { id: 3, name: "ID_Proof.png", type: "PNG", size: "880 KB", by: owner, date: "2026-06-01" },
    ],
    lists: [
      { id: 1, name: "High Intent Investors", count: 1240, type: "Static", date: "2026-04-11" },
      { id: 2, name: "Q2 Outreach Audience", count: 5821, type: "Dynamic", date: "2026-05-02" },
      { id: 3, name: "Webinar Registrants", count: 318, type: "Static", date: "2026-05-19" },
    ],
    shares: [
      { id: 1, with: "Priya Singh", by: owner, level: "Edit", date: "2026-05-25" },
      { id: 2, with: "Amit Kumar", by: "System", level: "View", date: "2026-06-02" },
    ],
    campaigns: [
      { id: 1, name: "Spring Promo", subject: "Unlock zero-brokerage this season", sent: "2026-05-10", status: "Clicked" },
      { id: 2, name: "Webinar Follow-up", subject: "Thanks for joining — your recording inside", sent: "2026-05-21", status: "Opened" },
      { id: 3, name: "Referral Drive", subject: "Refer a friend, earn rewards", sent: "2026-06-04", status: "Delivered" },
    ],
    audit: [
      { id: 1, action: "Updated", field: "Stage", from: "Contacted", to: "Qualified", by: "System", time: "4 days ago" },
      { id: 2, action: "Updated", field: "Owner", from: "Unassigned", to: owner, by: "Admin", time: "8 days ago" },
      { id: 3, action: "Created", field: "Contact", from: "—", to: "Imported via bulk upload", by: "System", time: "245 days ago" },
    ],
  };
}

/* ─────────────────────────  Small UI helpers  ───────────────────────── */

function TabToolbar({
  tabKey,
  placeholder,
  search,
  setSearch,
  filterValue,
  setFilterValue,
  sortValue,
  setSortValue,
}: {
  tabKey: string;
  placeholder: string;
  search: string;
  setSearch: (v: string) => void;
  filterValue: string;
  setFilterValue: (v: string) => void;
  sortValue: string;
  setSortValue: (v: string) => void;
}) {
  const cfg = TAB_TOOLBAR[tabKey];
  const filters = cfg?.filters ?? [];
  const sorts = cfg?.sorts ?? [];
  const activeFilter = filters.find((f) => f.value === filterValue) ?? filters[0];
  const activeSort = sorts.find((s) => s.value === sortValue) ?? sorts[0];
  const filterActive =
    !!activeFilter && activeFilter.value !== "all" && activeFilter.value !== "default";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-10 bg-muted/40 border-border/60"
        />
      </div>

      {/* Filter — narrows the list by status / category for the active tab */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`h-10 gap-2 ${
              filterActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/30 text-primary hover:bg-primary/10"
            }`}
          >
            <Filter className="h-4 w-4" />
            {filterActive ? activeFilter!.label : "Filter"}
            {filterActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Filter</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={activeFilter?.value} onValueChange={setFilterValue}>
            {filters.map((f) => (
              <DropdownMenuRadioItem key={f.value} value={f.value}>
                {f.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort — reorders the visible list */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 gap-2 text-muted-foreground">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">{activeSort?.label ?? "Sort"}</span>
            <span className="sm:hidden">Sort</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={activeSort?.value} onValueChange={setSortValue}>
            {sorts.map((s) => (
              <DropdownMenuRadioItem key={s.value} value={s.value}>
                {s.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
        <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-muted to-muted/40 border border-border/60 flex items-center justify-center">
          <Icon className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.4} />
        </div>
      </div>
      <p className="text-xl font-semibold text-foreground/70">{message}</p>
      <p className="text-sm text-muted-foreground mt-1">Records you add will show up here.</p>
    </div>
  );
}

/* ───────────────  Modern scrollable tab bar  ──────────────── */
// Horizontal tab rail that stays usable with many tabs: shows scroll
// chevrons + edge fades only when content overflows, keeps the active
// tab centered in view, and exposes the active index for a sliding
// progress underline.

function ScrollableTabBar({ activeTab }: { activeTab: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  // Center the active tab horizontally within the rail whenever it changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector('[data-state="active"]') as HTMLElement | null;
    if (active) {
      const elRect = el.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      const delta = aRect.left + aRect.width / 2 - (elRect.left + elRect.width / 2);
      el.scrollBy({ left: delta, behavior: "smooth" });
    }
    const t = setTimeout(updateArrows, 400);
    return () => clearTimeout(t);
  }, [activeTab, updateArrows]);

  const nudge = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <div className="relative flex min-w-0 flex-1 items-center">
      {/* Left chevron + fade */}
      <div className={`pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-14 bg-gradient-to-r from-card to-transparent transition-opacity duration-200 ${canLeft ? "opacity-100" : "opacity-0"}`} />
      <button
        type="button"
        aria-label="Scroll tabs left"
        onClick={() => nudge(-1)}
        className={`absolute left-1.5 z-20 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card shadow-sm transition-all hover:bg-primary/10 hover:text-primary ${canLeft ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div ref={scrollRef} className="flex-1 overflow-x-auto no-scrollbar scroll-smooth">
        <TabsList className="bg-transparent h-auto p-0 rounded-none w-max justify-start gap-0.5">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="group relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3.5 text-sm font-medium text-muted-foreground whitespace-nowrap data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-none hover:text-foreground transition-colors"
            >
              <t.icon className="h-4 w-4 mr-2 shrink-0" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Right chevron + fade */}
      <div className={`pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-14 bg-gradient-to-l from-card to-transparent transition-opacity duration-200 ${canRight ? "opacity-100" : "opacity-0"}`} />
      <button
        type="button"
        aria-label="Scroll tabs right"
        onClick={() => nudge(1)}
        className={`absolute right-1.5 z-20 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card shadow-sm transition-all hover:bg-primary/10 hover:text-primary ${canRight ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ───────────────────────────  Main page  ────────────────────────────── */

export default function LeadDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  // Lead read goes through React Query: seeds instantly from the list page's
  // sessionStorage stash, caches across navigation, and revalidates in the
  // background. `loading` is only true on a true cold load (no cache, no stash).
  const { data: lead, isPending, isFetching, refetch } = useLead(id);
  const loading = isPending && !lead;
  const { invalidateLead } = useLeadInvalidators();
  const [isStarred, setIsStarred] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("opportunities");
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  // Toolbar filter/sort for the active tab. "" sort = the tab's first sort.
  const [tabFilter, setTabFilter] = useState("all");
  const [tabSort, setTabSort] = useState("");

  // Dialogs
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isEmailLogOpen, setIsEmailLogOpen] = useState(false);
  const [isCallLogOpen, setIsCallLogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState<any>({});
  const [taskForm, setTaskForm] = useState({ subject: "", dueDate: "", priority: "medium" });
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });

  // Editable dummy collections (seeded once the lead resolves)
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const dummy = useMemo(() => buildDummy(lead), [lead]);

  // Refs for entrance animation
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Keep the edit form in sync with whatever the query resolves to.
  useEffect(() => {
    if (lead) setEditFormData(lead);
  }, [lead]);

  // Reset toolbar filter/sort when switching tabs so options stay relevant.
  useEffect(() => {
    setTabFilter("all");
    setTabSort("");
  }, [activeTab]);

  // Seed editable collections from dummy once the lead exists
  useEffect(() => {
    if (lead) {
      setOpportunities(dummy.opportunities);
      setTasks(dummy.tasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  // Entrance animation
  useEffect(() => {
    if (!loading && lead) {
      animateFadeUp(sidebarRef.current, 0);
      animateCardsIn(mainRef.current, ".anim-card", 0.12);
    }
  }, [loading, lead]);

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setTimeout(() => setRefreshing(false), 600));
    toast.success("Refreshed");
  };

  const handleSaveEdit = async () => {
    try {
      await api.leads.update(id, editFormData);
      toast.success("Lead updated successfully");
      setIsEditOpen(false);
      invalidateLead(id);
    } catch {
      toast.error("Failed to update lead");
    }
  };

  const handleAddOpportunity = () => {
    setOpportunities((prev) => [
      ...prev,
      { id: prev.length + 1, name: "New Opportunity", type: "Product Opportunity", owner: "Current User", status: "Open", stage: "Active", amount: 0, close: "—" },
    ]);
    setIsOpportunityOpen(false);
    toast.success("Opportunity created");
  };

  const handleAddTask = () => {
    if (!taskForm.subject) {
      toast.error("Task subject is required");
      return;
    }
    setTasks((prev) => [...prev, { id: prev.length + 1, ...taskForm, completed: false, owner: "Current User" }]);
    setIsTaskOpen(false);
    setTaskForm({ subject: "", dueDate: "", priority: "medium" });
    toast.success("Task created");
  };

  const toggleTask = (taskId: number) =>
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));

  const handleSendEmail = () => {
    if (!emailForm.subject || !emailForm.body) {
      toast.error("Subject and body are required");
      return;
    }
    setIsEmailOpen(false);
    setEmailForm({ subject: "", body: "" });
    toast.success("Email sent successfully");
  };

  if (loading) return <DetailSkeleton />;
  if (!lead)
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-semibold mb-4">Lead not found</p>
        <Button asChild>
          <Link href="/leads">Back to Leads</Link>
        </Button>
      </div>
    );

  const name = lead.contacts?.name || "No Name";
  const initial = name.charAt(0).toUpperCase();
  const score = lead.lead_scores?.score || 0;
  const contactAge = Math.max(
    1,
    Math.round((Date.now() - new Date(lead.created_at).getTime()) / 86400000)
  );

  const q = search.trim().toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);

  // Apply the active tab's search + filter + sort to a raw list.
  const processList = <T,>(items: T[]): T[] => {
    const cfg = TAB_TOOLBAR[activeTab];
    if (!cfg) return items;
    const f = cfg.filters.find((x) => x.value === tabFilter) ?? cfg.filters[0];
    const s = cfg.sorts.find((x) => x.value === tabSort) ?? cfg.sorts[0];
    let out = items.filter((i) => match(cfg.searchText(i)) && (f ? f.test(i) : true));
    if (s) out = [...out].sort(s.cmp);
    return out;
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden lg:flex lg:flex-col bg-gradient-to-b from-muted/30 via-background to-background">
      {/* Top breadcrumb bar */}
      <div className="sticky top-0 z-20 lg:shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hover:bg-muted">
            <Link href="/leads">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/leads" className="hover:text-foreground transition-colors">Contacts</Link>
            <ChevronRight />
            <span className="font-medium text-foreground truncate max-w-[200px]">{name}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditOpen(true)}>
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 ${refreshing || isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        {/* ───────────── Left profile sidebar (locked; scrolls internally if tall) ───────────── */}
        <aside ref={sidebarRef} className="space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto no-scrollbar pr-px">
          {/* Profile card */}
          <div className="relative rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary via-primary/80 to-teal-400" />
            <div className="px-5 pb-5 -mt-10">
              <div className="flex items-end justify-between">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-teal-500 ring-4 ring-card flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
                  {initial}
                </div>
                <button
                  onClick={() => setIsStarred((s) => !s)}
                  className="mb-1 h-9 w-9 rounded-full bg-card border border-border/60 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Star className={`h-4 w-4 transition-colors ${isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              </div>

              <h1 className="mt-3 text-xl font-extrabold tracking-tight truncate">{name}</h1>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge className="bg-primary/15 text-primary border-primary/30 border capitalize">
                  {lead.stage || "Prospect"}
                </Badge>
                {score >= 100 && (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/30 border gap-1">
                    <Flame className="h-3 w-3" /> Hot
                  </Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                {[
                  { icon: Target, label: "Opp", onClick: () => setIsOpportunityOpen(true) },
                  { icon: ListChecks, label: "Tasks", onClick: () => setIsTaskOpen(true) },
                  { icon: Mail, label: "Email", onClick: () => setIsEmailOpen(true) },
                  { icon: MoreHorizontal, label: "More", onClick: () => toast("More actions") },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    className="group flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background/40 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <a.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-medium text-muted-foreground">{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Phone */}
              <a
                href={`tel:${lead.contacts?.mobile}`}
                className="mt-4 flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 hover:border-primary/40 transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold tracking-wide">{lead.contacts?.mobile || "—"}</span>
              </a>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Contact ID", value: String(lead.id).slice(0, 7) },
              { label: "Contact Score", value: score },
              { label: "Engaged", value: 2 + (score % 5) },
              { label: "Contact Quality", value: score >= 100 ? "High" : score >= 60 ? "Mid" : "—" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="text-2xl font-extrabold text-foreground tabular-nums truncate">{s.value}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Lead Scoring */}
          <LeadScoringCard leadId={lead.id} />

          {/* Contact properties (collapsible) */}
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm overflow-hidden">
            <button
              onClick={() => setPropertiesOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-sm font-bold flex items-center gap-2">
                {propertiesOpen ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                Contact Properties
              </span>
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }} />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${propertiesOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 space-y-3.5">
                  {[
                    { label: "Owner", value: lead.assigned_to || "System" },
                    { label: "Contact Age", value: `${contactAge} Days` },
                    { label: "Contact Source", value: (lead.source || "—").replace("_", " ") },
                    { label: "Is Qualified", value: ["qualified", "won"].includes(lead.stage) ? "Yes" : "—" },
                    { label: "Product Interest", value: lead.product || "—" },
                    { label: "Campaign", value: lead.campaign || "—" },
                  ].map((p) => (
                    <div key={p.label}>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{p.label}</div>
                      {p.label === "Product Interest" && lead.product ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/opportunities?lead=${encodeURIComponent(lead.id)}&name=${encodeURIComponent(lead.contacts?.name || "")}&product=${encodeURIComponent(lead.product)}`
                            )
                          }
                          className="text-sm font-medium capitalize mt-0.5 text-primary hover:underline text-left"
                          title="Open this product's opportunity"
                        >
                          {p.value}
                        </button>
                      ) : (
                        <div className="text-sm font-medium capitalize mt-0.5">{p.value}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ───────────── Main content with tabs ───────────── */}
        <main ref={mainRef} className="lg:h-full lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
            {/* Tab bar (locked) */}
            <div className="anim-card rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-sm lg:shrink-0">
              <div className="flex items-center">
                <ScrollableTabBar activeTab={activeTab} />
                <div className="flex items-center gap-1 px-2 border-l border-border/60 shrink-0">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                    if (activeTab === "tasks") setIsTaskOpen(true);
                    else if (activeTab === "campaigns" || activeTab === "shares") setIsEmailOpen(true);
                    else setIsOpportunityOpen(true);
                  }}>
                    <Plus className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRefresh}>
                    <RefreshCw className={`h-4 w-4 ${refreshing || isFetching ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tab panels — the only region that scrolls on desktop */}
            <div className="anim-card mt-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-sm p-5 md:p-6 min-h-[480px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {/* Opportunities */}
              <TabsContent value="opportunities" className="m-0 focus-visible:outline-none">
                <TabToolbar tabKey="opportunities" placeholder="Search opportunities" search={search} setSearch={setSearch} filterValue={tabFilter} setFilterValue={setTabFilter} sortValue={tabSort} setSortValue={setTabSort} />
                {processList(opportunities).length ? (
                  <div className="space-y-3">
                    {processList(opportunities).map((opp) => (
                      <div key={opp.id} className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{opp.name}</h4>
                          <p className="text-xs text-muted-foreground">{opp.type} · {opp.owner}</p>
                        </div>
                        <div className="hidden sm:block text-right">
                          <div className="text-sm font-bold tabular-nums">₹{Number(opp.amount).toLocaleString("en-IN")}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" />{opp.close}</div>
                        </div>
                        <Badge className={opp.status === "Won" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border" : "bg-blue-500/10 text-blue-600 border-blue-500/30 border"}>
                          {opp.stage}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Inbox} message="No records added yet!" />
                )}
              </TabsContent>

              {/* Activity History */}
              <TabsContent value="activity" className="m-0 focus-visible:outline-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Activity Timeline</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsEmailLogOpen(true)}>
                      <Mail className="h-4 w-4" /> Log Email
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsCallLogOpen(true)}>
                      <PhoneCall className="h-4 w-4" /> Log Call
                    </Button>
                  </div>
                </div>
                <UnifiedTimeline contactId={lead.id} />
              </TabsContent>

              {/* Contact Details */}
              <TabsContent value="details" className="m-0 focus-visible:outline-none">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Contact Information</h3>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsEditOpen(true)}><Edit2 className="h-4 w-4" /> Edit</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  {Object.entries(dummy.details).map(([k, v]) => (
                    <div key={k} className="flex flex-col border-b border-border/40 pb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</span>
                      <span className="text-sm font-medium mt-1 capitalize truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tasks */}
              <TabsContent value="tasks" className="m-0 focus-visible:outline-none">
                <TabToolbar tabKey="tasks" placeholder="Search tasks" search={search} setSearch={setSearch} filterValue={tabFilter} setFilterValue={setTabFilter} sortValue={tabSort} setSortValue={setTabSort} />
                {processList(tasks).length ? (
                  <div className="space-y-3">
                    {processList(tasks).map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 transition-all">
                        <button onClick={() => toggleTask(task.id)} className="mt-0.5">
                          {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium ${task.completed ? "line-through opacity-50" : ""}`}>{task.subject}</h4>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {task.dueDate}</span>
                            <span>· {task.owner}</span>
                          </p>
                        </div>
                        <Badge className={
                          task.priority === "high" ? "bg-red-500/10 text-red-600 border-red-500/30 border"
                          : task.priority === "medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/30 border"
                          : "bg-slate-500/10 text-slate-600 border-slate-500/30 border"
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={ListChecks} message="No records added yet!" />
                )}
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="m-0 focus-visible:outline-none">
                <TabToolbar tabKey="documents" placeholder="Search documents" search={search} setSearch={setSearch} filterValue={tabFilter} setFilterValue={setTabFilter} sortValue={tabSort} setSortValue={setTabSort} />
                {processList(dummy.documents).length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {processList(dummy.documents).map((doc) => (
                      <div key={doc.id} className="group flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 hover:shadow-md transition-all">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                          <p className="text-[11px] text-muted-foreground">{doc.type} · {doc.size} · {doc.date}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={FileText} message="No records added yet!" />
                )}
              </TabsContent>

              {/* Member of Lists */}
              <TabsContent value="lists" className="m-0 focus-visible:outline-none">
                <TabToolbar tabKey="lists" placeholder="Search lists" search={search} setSearch={setSearch} filterValue={tabFilter} setFilterValue={setTabFilter} sortValue={tabSort} setSortValue={setTabSort} />
                {processList(dummy.lists).length ? (
                  <div className="space-y-3">
                    {processList(dummy.lists).map((list) => (
                      <div key={list.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 transition-all">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{list.name}</h4>
                          <p className="text-xs text-muted-foreground">{list.count.toLocaleString()} members · added {list.date}</p>
                        </div>
                        <Badge variant="outline" className={list.type === "Dynamic" ? "border-primary/40 text-primary" : ""}>{list.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Users} message="No records added yet!" />
                )}
              </TabsContent>

              {/* Contact Share History */}
              <TabsContent value="shares" className="m-0 focus-visible:outline-none">
                <TabToolbar tabKey="shares" placeholder="Search shares" search={search} setSearch={setSearch} filterValue={tabFilter} setFilterValue={setTabFilter} sortValue={tabSort} setSortValue={setTabSort} />
                {processList(dummy.shares).length ? (
                  <div className="space-y-3">
                    {processList(dummy.shares).map((s) => (
                      <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 transition-all">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-teal-500 text-white flex items-center justify-center font-semibold shrink-0">
                          {s.with.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">Shared with <span className="font-semibold">{s.with}</span></h4>
                          <p className="text-xs text-muted-foreground">by {s.by} · {s.date}</p>
                        </div>
                        <Badge className={s.level === "Edit" ? "bg-amber-500/10 text-amber-600 border-amber-500/30 border" : "bg-blue-500/10 text-blue-600 border-blue-500/30 border"}>{s.level}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Share2} message="No records added yet!" />
                )}
              </TabsContent>

              {/* Campaign Emails */}
              <TabsContent value="campaigns" className="m-0 focus-visible:outline-none">
                <TabToolbar tabKey="campaigns" placeholder="Search campaigns" search={search} setSearch={setSearch} filterValue={tabFilter} setFilterValue={setTabFilter} sortValue={tabSort} setSortValue={setTabSort} />
                {processList(dummy.campaigns).length ? (
                  <div className="space-y-3">
                    {processList(dummy.campaigns).map((c) => {
                      const statusMeta: Record<string, { icon: any; cls: string }> = {
                        Clicked: { icon: MousePointerClick, cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
                        Opened: { icon: Eye, cls: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
                        Delivered: { icon: CheckCheck, cls: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
                      };
                      const sm = statusMeta[c.status] ?? statusMeta.Delivered;
                      return (
                        <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/40 hover:border-primary/40 transition-all">
                          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Megaphone className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{c.subject}</h4>
                            <p className="text-xs text-muted-foreground">{c.name} · sent {c.sent}</p>
                          </div>
                          <Badge className={`${sm.cls} border gap-1`}><sm.icon className="h-3 w-3" />{c.status}</Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={Megaphone} message="No records added yet!" />
                )}
              </TabsContent>

              {/* Audit Trail */}
              <TabsContent value="audit" className="m-0 focus-visible:outline-none">
                <TabToolbar tabKey="audit" placeholder="Search audit log" search={search} setSearch={setSearch} filterValue={tabFilter} setFilterValue={setTabFilter} sortValue={tabSort} setSortValue={setTabSort} />
                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-semibold">Action</th>
                        <th className="px-4 py-3 font-semibold">Field</th>
                        <th className="px-4 py-3 font-semibold">Change</th>
                        <th className="px-4 py-3 font-semibold">By</th>
                        <th className="px-4 py-3 font-semibold">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processList(dummy.audit).map((a) => (
                        <tr key={a.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <Badge className={a.action === "Created" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border" : "bg-amber-500/10 text-amber-600 border-amber-500/30 border"}>{a.action}</Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">{a.field}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="line-through opacity-60">{a.from}</span>
                            <ArrowRight className="inline h-3 w-3 mx-1.5" />
                            <span className="text-foreground font-medium">{a.to}</span>
                          </td>
                          <td className="px-4 py-3">{a.by}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{a.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>

      {/* ───────────── Dialogs ───────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead details and information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Stage</label>
              <Select defaultValue={lead.stage} onValueChange={(v) => setEditFormData((p: any) => ({ ...p, stage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["prospect", "contacted", "qualified", "proposal", "won", "lost"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select defaultValue={lead.status} onValueChange={(v) => setEditFormData((p: any) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["active", "inactive", "closed"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Product</label>
              <Input defaultValue={lead.product} onChange={(e) => setEditFormData((p: any) => ({ ...p, product: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Campaign</label>
              <Input defaultValue={lead.campaign} onChange={(e) => setEditFormData((p: any) => ({ ...p, campaign: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpportunityOpen} onOpenChange={setIsOpportunityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Opportunity</DialogTitle>
            <DialogDescription>Create a new opportunity for this lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Opportunity Name</label>
              <Input placeholder="Enter opportunity name" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select defaultValue="product">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product Opportunity</SelectItem>
                  <SelectItem value="service">Service Opportunity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsOpportunityOpen(false)}>Cancel</Button>
              <Button onClick={handleAddOpportunity}>Create Opportunity</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Create a new task for this lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Subject</label>
              <Input placeholder="Enter task subject" value={taskForm.subject} onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={taskForm.priority} onValueChange={(val) => setTaskForm({ ...taskForm, priority: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsTaskOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTask}>Create Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>Send an email to {lead.contacts?.email || "this lead"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">To</label>
              <Input disabled value={lead.contacts?.email || ""} />
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input placeholder="Enter email subject" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="Enter your message" rows={6} value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
              <Button onClick={handleSendEmail} className="gap-2">
                <Send className="h-4 w-4" /> Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email/Call Loggers */}
      <EmailCallLogger
        contactId={lead.id}
        type="email"
        open={isEmailLogOpen}
        onOpenChange={setIsEmailLogOpen}
        onSuccess={() => refetch()}
      />
      <EmailCallLogger
        contactId={lead.id}
        type="call"
        open={isCallLogOpen}
        onOpenChange={setIsCallLogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

/* Tiny chevron used in the breadcrumb */
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
