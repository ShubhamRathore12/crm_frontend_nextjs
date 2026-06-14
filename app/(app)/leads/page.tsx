"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, Lead, Contact, User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BulkUploadModal } from "@/components/leads/bulk-upload-modal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Clipboard,
  MessageSquare,
  X,
  Check,
  AlertTriangle,
  Flame,
  Activity,
  ArrowUpRight,
  SlidersHorizontal,
  Star,
  MoreVertical,
} from "lucide-react";

export default function LeadsPage() {
  // --- State Variables ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    newToday: 0,
    avgScore: 0,
    conversionRate: 0,
  });

  // Filter values
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  // Metadata Lists
  const [agents, setAgents] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modals & Panels
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkStageOpen, setIsBulkStageOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // New State variables for Premium UI Features
  const [activeTab, setActiveTab] = useState<"all" | "my_leads" | "high_score" | "starred" | "recently_created">("all");
  const [starredLeadIds, setStarredLeadIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    score: true,
    stage: true,
    status: true,
    source: true,
    owner: true,
    created: true,
  });

  // Hydrate logged-in user and starred leads on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
      
      const storedStars = localStorage.getItem("crm_starred_leads");
      if (storedStars) {
        try {
          setStarredLeadIds(JSON.parse(storedStars));
        } catch (e) {
          console.error("Failed to parse starred leads", e);
        }
      }
    }
  }, []);

  const toggleStarLead = (id: string) => {
    setStarredLeadIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem("crm_starred_leads", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Active items for Modals
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [activeInteractionType, setActiveInteractionType] = useState<"call" | "email">("call");

  // Form Fields
  // Quick Add Form
  const [qaCreateNewContact, setQaCreateNewContact] = useState(true);
  const [qaContactId, setQaContactId] = useState("");
  const [qaContactName, setQaContactName] = useState("");
  const [qaContactEmail, setQaContactEmail] = useState("");
  const [qaContactPhone, setQaContactPhone] = useState("");
  const [qaContactCompany, setQaContactCompany] = useState("");
  const [qaSource, setQaSource] = useState("website");
  const [qaProduct, setQaProduct] = useState("");
  const [qaCampaign, setQaCampaign] = useState("");
  const [qaStage, setQaStage] = useState("prospect");
  const [qaStatus, setQaStatus] = useState("active");
  const [qaAssignedTo, setQaAssignedTo] = useState("");

  // Edit Form
  const [editSource, setEditSource] = useState("");
  const [editProduct, setEditProduct] = useState("");
  const [editCampaign, setEditCampaign] = useState("");
  const [editStage, setEditStage] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");

  // Activity Form
  const [activityType, setActivityType] = useState("Call");
  const [activityNote, setActivityNote] = useState("");

  // Interaction (Call/Email Simulation) Form
  const [interactionResult, setInteractionResult] = useState("");

  // Bulk Actions Form
  const [bulkAgentId, setBulkAgentId] = useState("");
  const [bulkStage, setBulkStage] = useState("");

  // --- Fetching Data ---
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.leads.list({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery || undefined,
        status: filterStatus || undefined,
        stage: filterStage || undefined,
        source: filterSource || undefined,
        assigned_to: filterAssignee || undefined,
      });
      
      setLeads(res.data ?? []);
      setTotalLeads(res.total ?? 0);
      setTotalPages(res.pages ?? 1);
    } catch (err) {
      console.error("Failed to load leads", err);
      // Toast message on error
      toast.error("Failed to fetch leads from server");
      // Fallback mockup
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, filterStage, filterStatus, filterSource, filterAssignee]);

  const fetchStatsAndMetadata = useCallback(async () => {
    try {
      // Fetch Agents
      try {
        const agentsRes = await api.users.agents();
        if (Array.isArray(agentsRes)) {
          setAgents(agentsRes);
        } else if (agentsRes && typeof agentsRes === 'object') {
          setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
        } else {
          setAgents([]);
        }
      } catch (err) {
        console.error("Failed to fetch agents", err);
        setAgents([]);
      }

      // Fetch Contacts for dropdown
      try {
        const contactsRes = await api.contacts.list({ limit: "100" });
        setContacts(contactsRes.data ?? []);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
        setContacts([]);
      }

      // Fetch Lead Stats
      try {
        const statsRes = await api.leads.stats();
        if (statsRes) {
          const wonCount = statsRes.by_status?.find(s => s.label.toLowerCase() === "won")?.count || 0;
          const totalLeadsCount = statsRes.total || 1;
          const convRate = Math.round((wonCount / totalLeadsCount) * 100);
          
          setStats({
            total: statsRes.total || 0,
            newToday: statsRes.growth?.[statsRes.growth.length - 1]?.value || 0,
            avgScore: 88, // Mock average score fallback
            conversionRate: convRate || 14,
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    } catch (err) {
      console.error("Error loading stats/metadata", err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchStatsAndMetadata();
  }, [fetchStatsAndMetadata]);

  // --- Actions ---

  // Clear Filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterStage("");
    setFilterStatus("");
    setFilterSource("");
    setFilterAssignee("");
    setPage(1);
    toast.success("Filters cleared");
  };

  // Checkbox Management
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(leads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds((prev) => [...prev, id]);
    } else {
      setSelectedLeadIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Inline updates
  const handleInlineStageChange = async (leadId: string, stage: string) => {
    try {
      await api.leads.update(leadId, { stage });
      toast.success("Stage updated successfully");
      fetchLeads();
      fetchStatsAndMetadata();
    } catch (err) {
      toast.error("Failed to update stage", { description: (err as Error).message });
    }
  };

  const handleInlineStatusChange = async (leadId: string, status: string) => {
    try {
      await api.leads.update(leadId, { status });
      toast.success("Status updated successfully");
      fetchLeads();
    } catch (err) {
      toast.error("Failed to update status", { description: (err as Error).message });
    }
  };

  const handleInlineAssigneeChange = async (leadId: string, agentId: string) => {
    try {
      if (!agentId) return;
      await api.leads.assign(leadId, agentId);
      toast.success("Lead reassigned successfully");
      fetchLeads();
    } catch (err) {
      toast.error("Failed to reassign lead", { description: (err as Error).message });
    }
  };

  // Quick Add Lead Save
  const handleQuickAddSave = async () => {
    try {
      let finalContactId = qaContactId;

      if (qaCreateNewContact) {
        if (!qaContactName || !qaContactPhone) {
          toast.error("Name and Phone are mandatory for new contacts");
          return;
        }
        // Create new contact
        const contact = await api.contacts.create({
          name: qaContactName,
          email: qaContactEmail,
          phone: qaContactPhone,
          company: qaContactCompany || undefined,
        });
        finalContactId = contact.id;
      }

      if (!finalContactId) {
        toast.error("Please select or create a contact");
        return;
      }

      // Create lead
      await api.leads.create({
        contact_id: finalContactId,
        source: qaSource,
        product: qaProduct || undefined,
        campaign: qaCampaign || undefined,
        status: qaStatus || undefined,
        stage: qaStage || undefined,
        assigned_to: qaAssignedTo || undefined,
      });

      toast.success("Lead created successfully");
      setIsQuickAddOpen(false);
      resetQuickAddForm();
      fetchLeads();
      fetchStatsAndMetadata();
    } catch (err) {
      toast.error("Failed to create lead", { description: (err as Error).message });
    }
  };

  const resetQuickAddForm = () => {
    setQaCreateNewContact(true);
    setQaContactId("");
    setQaContactName("");
    setQaContactEmail("");
    setQaContactPhone("");
    setQaContactCompany("");
    setQaSource("website");
    setQaProduct("");
    setQaCampaign("");
    setQaStage("prospect");
    setQaStatus("active");
    setQaAssignedTo("");
  };

  // Edit Lead Modal Load & Save
  const handleEditClick = (lead: Lead) => {
    setActiveLead(lead);
    setEditSource(lead.source || "website");
    setEditProduct(lead.product || "");
    setEditCampaign(lead.campaign || "");
    setEditStage(lead.stage || "prospect");
    setEditStatus(lead.status || "active");
    setEditAssignedTo(lead.assigned_to || "");
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!activeLead) return;
    try {
      await api.leads.update(activeLead.id, {
        source: editSource,
        product: editProduct || undefined,
        campaign: editCampaign || undefined,
        status: editStatus,
        stage: editStage,
        assigned_to: editAssignedTo || undefined,
      });

      toast.success("Lead updated successfully");
      setIsEditOpen(false);
      fetchLeads();
      fetchStatsAndMetadata();
    } catch (err) {
      toast.error("Failed to update lead", { description: (err as Error).message });
    }
  };

  // Single Delete
  const handleDeleteClick = (lead: Lead) => {
    setActiveLead(lead);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeLead) return;
    try {
      await api.leads.delete(activeLead.id);
      toast.success("Lead deleted successfully");
      setIsDeleteConfirmOpen(false);
      setSelectedLeadIds((prev) => prev.filter((id) => id !== activeLead.id));
      fetchLeads();
      fetchStatsAndMetadata();
    } catch (err) {
      toast.error("Failed to delete lead", { description: (err as Error).message });
    }
  };

  // Add Activity Save
  const handleAddActivityClick = (lead: Lead) => {
    setActiveLead(lead);
    setActivityType("Call");
    setActivityNote("");
    setIsActivityOpen(true);
  };

  const handleAddActivitySave = async () => {
    if (!activeLead || !activityNote.trim()) {
      toast.error("Activity note cannot be empty");
      return;
    }
    try {
      await api.leads.addNote(
        activeLead.id,
        `[${activityType}] ${activityNote}`
      );
      toast.success("Activity logged successfully");
      setIsActivityOpen(false);
    } catch (err) {
      toast.error("Failed to log activity", { description: (err as Error).message });
    }
  };

  // Call/Email simulation
  const handleInteractionClick = (lead: Lead, type: "call" | "email") => {
    setActiveLead(lead);
    setActiveInteractionType(type);
    setInteractionResult("");
    setIsInteractionOpen(true);
  };

  const handleInteractionSave = async () => {
    if (!activeLead) return;
    const noteContent = interactionResult.trim() || `Simulation completed with no custom notes.`;
    const actionLabel = activeInteractionType === "call" ? "Phone Call Log" : "Email Sent Log";
    try {
      await api.leads.addNote(
        activeLead.id,
        `[${actionLabel}] ${noteContent}`
      );
      toast.success(`${activeInteractionType === "call" ? "Call" : "Email"} logged successfully`);
      setIsInteractionOpen(false);
    } catch (err) {
      toast.error("Failed to save log", { description: (err as Error).message });
    }
  };

  // Bulk Assign
  const handleBulkAssignSave = async () => {
    if (selectedLeadIds.length === 0 || !bulkAgentId) {
      toast.error("Please select leads and an agent");
      return;
    }
    try {
      await api.leads.bulkAssign({
        lead_ids: selectedLeadIds,
        agent_ids: [bulkAgentId],
      });
      toast.success(`Assigned ${selectedLeadIds.length} leads successfully`);
      setIsBulkAssignOpen(false);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err) {
      toast.error("Bulk assignment failed", { description: (err as Error).message });
    }
  };

  // Bulk Stage Update
  const handleBulkStageSave = async () => {
    if (selectedLeadIds.length === 0 || !bulkStage) {
      toast.error("Please select leads and a stage");
      return;
    }
    try {
      let successCount = 0;
      await Promise.all(
        selectedLeadIds.map(async (id) => {
          try {
            await api.leads.update(id, { stage: bulkStage });
            successCount++;
          } catch (e) {
            console.error(`Failed to update stage for ${id}`, e);
          }
        })
      );
      toast.success(`Updated stage for ${successCount} leads`);
      setIsBulkStageOpen(false);
      setSelectedLeadIds([]);
      fetchLeads();
      fetchStatsAndMetadata();
    } catch (err) {
      toast.error("Bulk stage update failed", { description: (err as Error).message });
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete all ${selectedLeadIds.length} selected leads?`)) return;

    try {
      let successCount = 0;
      await Promise.all(
        selectedLeadIds.map(async (id) => {
          try {
            await api.leads.delete(id);
            successCount++;
          } catch (e) {
            console.error(`Failed to delete lead ${id}`, e);
          }
        })
      );
      toast.success(`Deleted ${successCount} leads successfully`);
      setSelectedLeadIds([]);
      fetchLeads();
      fetchStatsAndMetadata();
    } catch (err) {
      toast.error("Bulk delete failed", { description: (err as Error).message });
    }
  };

  // CSV Export client-side
  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }
    try {
      const headers = ["Lead ID", "Name", "Email", "Phone", "Source", "Score", "Stage", "Status", "Assigned Agent", "Created On"];
      const rows = leads.map(l => [
        l.id,
        l.contacts?.name || "Unlinked Contact",
        l.contacts?.email || "",
        l.contacts?.mobile || "",
        l.source || "",
        l.lead_scores?.score || 0,
        l.stage || "",
        l.status || "",
        (Array.isArray(agents) ? agents.find(a => a.id === l.assigned_to)?.name : null) || l.assigned_to || "Unassigned",
        new Date(l.created_at).toLocaleDateString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `crm_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV file downloaded successfully");
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  // Get score style helper
  const getScoreStyle = (score: number) => {
    if (score >= 120) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (score >= 80) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  // Client-side filtering based on active tab
  const displayedLeads = leads.filter((lead) => {
    if (activeTab === "my_leads" && currentUser && lead.assigned_to !== currentUser.id) {
      return false;
    }
    if (activeTab === "starred" && !starredLeadIds.includes(lead.id)) {
      return false;
    }
    if (activeTab === "high_score") {
      const score = lead.lead_scores?.score ?? 45;
      if (score < 100) return false;
    }
    if (activeTab === "recently_created") {
      const createdDate = new Date(lead.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (createdDate < sevenDaysAgo) return false;
    }
    return true;
  });

  // Color helpers for dropdown inline selector badges
  const getStageBadgeStyles = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case "won":
        return "bg-green-500/10 text-green-500 border-green-500/25";
      case "lost":
        return "bg-red-500/10 text-red-500 border-red-500/25";
      case "proposal":
        return "bg-blue-500/10 text-blue-500 border-blue-500/25";
      case "qualified":
        return "bg-purple-500/10 text-purple-500 border-purple-500/25";
      case "contacted":
        return "bg-amber-500/10 text-amber-500 border-amber-500/25";
      case "lead":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/25";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/25";
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/25";
      case "inactive":
        return "bg-slate-500/10 text-slate-500 border-slate-500/25";
      case "closed":
        return "bg-red-500/10 text-red-500 border-red-500/25";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/25";
    }
  };

  const getScoreBadgeStyles = (score: number) => {
    if (score >= 120) return "bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.12)]";
    if (score >= 80) return "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.08)]";
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.08)]";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 animate-in fade-in-50 duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent flex items-center gap-2">
            Lead Management
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track, filter, score, and transition leads through the marketing and sales pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="gap-2 backdrop-blur-md bg-background/50">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 backdrop-blur-md bg-background/50">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => setIsQuickAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2">
            <Plus className="h-4 w-4" /> Quick Add Lead
          </Button>
        </div>
      </div>

      {/* KPI STATS TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card className="relative overflow-hidden border border-border bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all hover:-translate-y-0.5 duration-300 group shadow-lg">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500/80 to-cyan-400/80" />
          <CardContent className="p-5 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Leads</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-[1.02]">
                {stats.total}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 transition-all duration-300 group-hover:bg-blue-50 group-hover:text-white group-hover:rotate-6">
              <UserIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* New Today */}
        <Card className="relative overflow-hidden border border-border bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all hover:-translate-y-0.5 duration-300 group shadow-lg">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500/80 to-yellow-400/80" />
          <CardContent className="p-5 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Today</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-1.5 transition-all duration-300 group-hover:scale-[1.02]">
                {stats.newToday}
                <span className="text-xs text-green-500 flex items-center font-semibold bg-green-500/10 px-1.5 py-0.5 rounded-full">
                  <ArrowUpRight className="h-3 w-3" /> +20%
                </span>
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 transition-all duration-300 group-hover:bg-amber-505 group-hover:bg-amber-500 group-hover:text-white group-hover:rotate-6">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Lead Score */}
        <Card className="relative overflow-hidden border border-border bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all hover:-translate-y-0.5 duration-300 group shadow-lg">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500/80 to-pink-400/80" />
          <CardContent className="p-5 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Lead Score</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-[1.02]">
                {stats.avgScore}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 transition-all duration-300 group-hover:bg-purple-500 group-hover:text-white group-hover:rotate-6">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="relative overflow-hidden border border-border bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all hover:-translate-y-0.5 duration-300 group shadow-lg">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-green-500/80 to-emerald-400/80" />
          <CardContent className="p-5 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Win Rate</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-[1.02]">
                {stats.conversionRate}%
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500 transition-all duration-300 group-hover:bg-green-500 group-hover:text-white group-hover:rotate-6">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMART VIEWS TABS */}
      <div className="flex border-b border-border pb-px overflow-x-auto gap-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Leads
        </button>
        <button
          onClick={() => setActiveTab("my_leads")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "my_leads"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Active Leads
        </button>
        <button
          onClick={() => setActiveTab("high_score")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "high_score"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          Hot Leads (&gt;=100)
        </button>
        <button
          onClick={() => setActiveTab("starred")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "starred"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          Starred
        </button>
        <button
          onClick={() => setActiveTab("recently_created")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "recently_created"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Recently Created
        </button>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Global Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads name, email, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 bg-background/50 hover:bg-background/80 focus:bg-background transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Button
                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                variant="outline"
                className={`gap-2 rounded-lg transition-all ${
                  isAdvancedFiltersOpen || filterStage || filterStatus || filterSource || filterAssignee
                    ? "border-primary bg-primary/5 text-primary"
                    : "bg-background/50"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {(filterStage || filterStatus || filterSource || filterAssignee) && (
                  <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold">
                    { [filterStage, filterStatus, filterSource, filterAssignee].filter(Boolean).length }
                  </Badge>
                )}
              </Button>

              <Button onClick={fetchLeads} variant="ghost" size="icon" className="h-9 w-9 hover:bg-secondary shrink-0" title="Refresh leads data">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {isAdvancedFiltersOpen && (
            <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
              {/* Stage Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Stage</label>
                <select
                  value={filterStage}
                  onChange={(e) => { setFilterStage(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-ring focus:outline-none focus:bg-background transition-colors"
                >
                  <option value="">All Stages</option>
                  <option value="prospect">Prospect</option>
                  <option value="lead">Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-ring focus:outline-none focus:bg-background transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Source</label>
                <select
                  value={filterSource}
                  onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-ring focus:outline-none focus:bg-background transition-colors"
                >
                  <option value="">All Sources</option>
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                  <option value="referral">Referral</option>
                  <option value="partner">Partner</option>
                  <option value="social">Social</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="paid_ads">Paid Ads</option>
                  <option value="event">Event</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>

              {/* Agent Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Owner</label>
                <select
                  value={filterAssignee}
                  onChange={(e) => { setFilterAssignee(e.target.value); setPage(1); }}
                  className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-ring focus:outline-none focus:bg-background transition-colors"
                >
                  <option value="">All Owners</option>
                  {Array.isArray(agents) && agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters button */}
              {(filterStage || filterStatus || filterSource || filterAssignee) && (
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" /> Reset Advanced Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MAIN LEADS TABLE CARD */}
      <Card className="shadow-lg border-border bg-card/45 backdrop-blur-md overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="p-4 w-16 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={displayedLeads.length > 0 && selectedLeadIds.length === displayedLeads.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer transition-all"
                    />
                  </div>
                </th>
                <th className="p-4 min-w-[200px] font-bold">Lead Name / Contact Info</th>
                {visibleColumns.score && <th className="p-4 w-[110px] text-center font-bold">Score</th>}
                {visibleColumns.stage && <th className="p-4 min-w-[140px] font-bold">Stage</th>}
                {visibleColumns.status && <th className="p-4 min-w-[130px] font-bold">Status</th>}
                {visibleColumns.source && <th className="p-4 min-w-[120px] font-bold">Source</th>}
                {visibleColumns.owner && <th className="p-4 min-w-[160px] font-bold">Owner</th>}
                {visibleColumns.created && <th className="p-4 w-[120px] font-bold">Created</th>}
                <th className="p-4 w-[160px] text-right font-bold">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Actions</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
                          title="Manage columns"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Show / Hide Columns
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.score}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, score: checked }))}
                        >
                          Lead Score
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.stage}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, stage: checked }))}
                        >
                          Pipeline Stage
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.status}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, status: checked }))}
                        >
                          Status
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.source}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, source: checked }))}
                        >
                          Source
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.owner}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, owner: checked }))}
                        >
                          Owner
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={visibleColumns.created}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, created: checked }))}
                        >
                          Created Date
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && leads.length === 0 ? (
                // Skeleton Loader
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4 text-center"><div className="h-4 w-4 bg-muted rounded mx-auto" /></td>
                    <td className="p-4">
                      <div className="h-4 w-32 bg-muted rounded mb-2" />
                      <div className="h-3 w-48 bg-muted rounded" />
                    </td>
                    {visibleColumns.score && <td className="p-4"><div className="h-7 w-12 bg-muted rounded mx-auto" /></td>}
                    {visibleColumns.stage && <td className="p-4"><div className="h-8 w-24 bg-muted rounded" /></td>}
                    {visibleColumns.status && <td className="p-4"><div className="h-8 w-20 bg-muted rounded" /></td>}
                    {visibleColumns.source && <td className="p-4"><div className="h-5 w-16 bg-muted rounded" /></td>}
                    {visibleColumns.owner && <td className="p-4"><div className="h-8 w-28 bg-muted rounded" /></td>}
                    {visibleColumns.created && <td className="p-4"><div className="h-3 w-16 bg-muted rounded" /></td>}
                    <td className="p-4"><div className="h-8 w-24 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : displayedLeads.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={3 + Object.values(visibleColumns).filter(Boolean).length} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3 py-6">
                      <SlidersHorizontal className="h-10 w-10 text-muted-foreground/40" />
                      <p className="font-bold text-base">No leads found matching current criteria.</p>
                      <p className="text-sm max-w-sm text-muted-foreground/85">
                        Try clearing filters, switching tabs, or creating a new lead.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Lead Rows
                displayedLeads.map((lead) => {
                  const score = lead.lead_scores?.score || 45; // Default score fallback
                  const isChecked = selectedLeadIds.includes(lead.id);
                  const isStarred = starredLeadIds.includes(lead.id);

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-muted/20 transition-all duration-150 group border-b ${
                        isChecked ? 'bg-primary/5 hover:bg-primary/5' : ''
                      }`}
                    >
                      {/* Checkbox & Star */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
                            className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer transition-all"
                          />
                          <button
                            onClick={() => toggleStarLead(lead.id)}
                            className={`p-1 rounded-full transition-colors ${
                              isStarred
                                ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                : "text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10"
                            }`}
                            title={isStarred ? "Unstar lead" : "Star lead"}
                          >
                            <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </td>

                      {/* Name / Info */}
                      <td className="p-4">
                        <div className="flex flex-col space-y-1">
                          <Link 
                            href={`/leads/${lead.id}`}
                            className="font-bold text-foreground hover:text-primary hover:underline transition-colors text-sm flex items-center gap-1.5 w-fit"
                          >
                            {lead.contacts?.name || "Unlinked Contact"}
                          </Link>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                            {lead.contacts?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground/60" /> {lead.contacts.email}
                              </span>
                            )}
                            {lead.contacts?.mobile && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground/60" /> {lead.contacts.mobile}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      {visibleColumns.score && (
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={`font-extrabold text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 w-fit mx-auto ${getScoreBadgeStyles(score)}`}>
                            <Flame className={`h-3 w-3 ${score >= 120 ? "animate-pulse fill-current" : ""}`} />
                            {score}
                          </Badge>
                        </td>
                      )}

                      {/* Stage Selector */}
                      {visibleColumns.stage && (
                        <td className="p-4">
                          <div className={`relative inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-all focus-within:ring-1 focus-within:ring-ring ${getStageBadgeStyles(lead.stage)}`}>
                            <select
                              value={lead.stage}
                              onChange={(e) => handleInlineStageChange(lead.id, e.target.value)}
                              className="bg-transparent pr-4 font-bold focus:outline-none cursor-pointer appearance-none text-[11px]"
                            >
                              <option value="prospect">Prospect</option>
                              <option value="lead">Lead</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="proposal">Proposal</option>
                              <option value="won">Won</option>
                              <option value="lost">Lost</option>
                            </select>
                            <span className="absolute right-2.5 pointer-events-none text-current text-[10px]">▼</span>
                          </div>
                        </td>
                      )}

                      {/* Status Selector */}
                      {visibleColumns.status && (
                        <td className="p-4">
                          <div className={`relative inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-all focus-within:ring-1 focus-within:ring-ring ${getStatusBadgeStyles(lead.status)}`}>
                            <select
                              value={lead.status}
                              onChange={(e) => handleInlineStatusChange(lead.id, e.target.value)}
                              className="bg-transparent pr-4 font-bold focus:outline-none cursor-pointer appearance-none text-[11px]"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="closed">Closed</option>
                            </select>
                            <span className="absolute right-2.5 pointer-events-none text-current text-[10px]">▼</span>
                          </div>
                        </td>
                      )}

                      {/* Source */}
                      {visibleColumns.source && (
                        <td className="p-4">
                          <Badge variant="secondary" className="capitalize text-[10px] font-bold border-muted px-2 py-0.5 bg-background/50 hover:bg-background/80 transition-colors">
                            {lead.source?.replace("_", " ") || "Website"}
                          </Badge>
                        </td>
                      )}

                      {/* Owner / Assignee Selector */}
                      {visibleColumns.owner && (
                        <td className="p-4">
                          <div className="relative inline-flex items-center rounded-full border border-border bg-background/50 hover:bg-background/85 transition-all px-2.5 py-0.5 text-xs font-semibold focus-within:ring-1 focus-within:ring-ring">
                            <select
                              value={lead.assigned_to || ""}
                              onChange={(e) => handleInlineAssigneeChange(lead.id, e.target.value)}
                              className="bg-transparent pr-4 font-semibold focus:outline-none cursor-pointer appearance-none text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              <option value="">Unassigned</option>
                              {Array.isArray(agents) && agents.map((agent) => (
                                <option key={agent.id} value={agent.id} className="text-foreground bg-background">
                                  {agent.name}
                                </option>
                              ))}
                            </select>
                            <span className="absolute right-2.5 pointer-events-none text-muted-foreground text-[10px]">▼</span>
                          </div>
                        </td>
                      )}

                      {/* Created On */}
                      {visibleColumns.created && (
                        <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : "—"}
                        </td>
                      )}

                      {/* Action Menu */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {lead.contacts?.email && (
                            <Button 
                              onClick={() => handleInteractionClick(lead, "email")}
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 transition-colors"
                              title="Simulate sending email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {lead.contacts?.mobile && (
                            <Button 
                              onClick={() => handleInteractionClick(lead, "call")}
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-green-500/10 text-muted-foreground hover:text-green-500 transition-colors"
                              title="Simulate outbound call"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleAddActivityClick(lead)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-purple-500/10 text-muted-foreground hover:text-purple-500 transition-colors"
                            title="Log Activity / Note"
                          >
                            <Clipboard className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleEditClick(lead)} className="cursor-pointer gap-2">
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Lead
                              </DropdownMenuItem>
                              <Link href={`/leads/${lead.id}`}>
                                <DropdownMenuItem className="cursor-pointer gap-2">
                                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" /> View Details
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(lead)}
                                className="cursor-pointer text-red-500 focus:text-red-500 gap-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Showing page {page} of {totalPages} ({activeTab !== "all" ? displayedLeads.length : totalLeads} leads)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* FLOATING GLASSMORPHIC BULK ACTIONS BAR */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-lg border border-primary/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom duration-300 max-w-[90vw] md:max-w-max flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground font-semibold px-2.5 py-0.5 rounded-full">
              {selectedLeadIds.length} Selected
            </Badge>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Apply bulk operations:</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsBulkAssignOpen(true)} variant="outline" size="sm" className="h-8 text-xs border-primary/20 hover:border-primary/50 gap-1.5 rounded-full bg-background/50 hover:bg-background/80">
              <UserCheck className="h-3.5 w-3.5 text-primary" /> Assign Agent
            </Button>
            <Button onClick={() => setIsBulkStageOpen(true)} variant="outline" size="sm" className="h-8 text-xs border-primary/20 hover:border-primary/50 gap-1.5 rounded-full bg-background/50 hover:bg-background/80">
              <Clipboard className="h-3.5 w-3.5 text-primary" /> Change Stage
            </Button>
            <Button onClick={handleBulkDelete} variant="outline" size="sm" className="h-8 text-xs border-red-200 hover:bg-red-500/10 hover:text-red-500 hover:border-red-400 text-red-400 gap-1.5 rounded-full bg-background/50">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <button onClick={() => setSelectedLeadIds([])} className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Clear selection">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- QUICK ADD LEAD DIALOG --- */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="max-w-md w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Add Lead</DialogTitle>
            <DialogDescription>
              Create a new lead and associate or create contact information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Contact Switcher Option */}
            <div className="flex items-center justify-between border-b pb-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground">CONTACT LINKING</span>
              <div className="flex border rounded-md overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setQaCreateNewContact(true)}
                  className={`px-3 py-1.5 transition-colors ${
                    qaCreateNewContact ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  }`}
                >
                  Create Contact
                </button>
                <button
                  onClick={() => setQaCreateNewContact(false)}
                  className={`px-3 py-1.5 transition-colors ${
                    !qaCreateNewContact ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  }`}
                >
                  Existing Contact
                </button>
              </div>
            </div>

            {/* CONTACT INFO FIELDS */}
            {qaCreateNewContact ? (
              <div className="space-y-3 p-3 bg-secondary/35 rounded-lg border border-border/40">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">New Contact details</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Contact Name *</label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={qaContactName}
                      onChange={(e) => setQaContactName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Mobile Number *</label>
                    <Input
                      placeholder="e.g. +91 9876543210"
                      value={qaContactPhone}
                      onChange={(e) => setQaContactPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Email Address</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={qaContactEmail}
                      onChange={(e) => setQaContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Company Name</label>
                    <Input
                      placeholder="e.g. Acme Inc"
                      value={qaContactCompany}
                      onChange={(e) => setQaContactCompany(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Existing Contact *</label>
                <select
                  value={qaContactId}
                  onChange={(e) => setQaContactId(e.target.value)}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select a contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mobile || c.email || "No details"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* LEAD FIELDS */}
            <div className="space-y-3 mt-4">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground border-t pt-3">Lead Pipeline Details</p>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Source</label>
                  <select
                    value={qaSource}
                    onChange={(e) => setQaSource(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="website">Website</option>
                    <option value="email">Email</option>
                    <option value="referral">Referral</option>
                    <option value="partner">Partner</option>
                    <option value="social">Social</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="paid_ads">Paid Ads</option>
                    <option value="event">Event</option>
                    <option value="inbound">Inbound</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Assigned Agent</label>
                  <select
                    value={qaAssignedTo}
                    onChange={(e) => setQaAssignedTo(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {Array.isArray(agents) && agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Product interest</label>
                  <Input
                    placeholder="e.g. Cloud ERP"
                    value={qaProduct}
                    onChange={(e) => setQaProduct(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Marketing Campaign</label>
                  <Input
                    placeholder="e.g. Summer Promo 2026"
                    value={qaCampaign}
                    onChange={(e) => setQaCampaign(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Initial Stage</label>
                  <select
                    value={qaStage}
                    onChange={(e) => setQaStage(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="lead">Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Initial Status</label>
                  <select
                    value={qaStatus}
                    onChange={(e) => setQaStatus(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setIsQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickAddSave}>
              Save Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT LEAD DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit Lead Details</DialogTitle>
            <DialogDescription>
              Modify pipeline, ownership, or tracking properties for this lead.
            </DialogDescription>
          </DialogHeader>

          {activeLead && (
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Lead Source</label>
                <select
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                  <option value="referral">Referral</option>
                  <option value="partner">Partner</option>
                  <option value="social">Social</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="paid_ads">Paid Ads</option>
                  <option value="event">Event</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Assigned Agent (Owner)</label>
                <select
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {Array.isArray(agents) && agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Product interest</label>
                  <Input
                    placeholder="e.g. Cloud ERP"
                    value={editProduct}
                    onChange={(e) => setEditProduct(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Campaign</label>
                  <Input
                    placeholder="e.g. Summer Promo 2026"
                    value={editCampaign}
                    onChange={(e) => setEditCampaign(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Pipeline Stage</label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="lead">Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Lead Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ADD ACTIVITY / NOTE DIALOG --- */}
      <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Add Activity Log</DialogTitle>
            <DialogDescription>
              Record a history note, interaction, or event log for {activeLead?.contacts?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
              >
                <option value="Call">Phone Call</option>
                <option value="Email">Email Communication</option>
                <option value="Meeting">In-Person/Zoom Meeting</option>
                <option value="Demo">Product Demonstration</option>
                <option value="Note">General Note/Remark</option>
                <option value="Escalation">Escalation / Issue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Summary / Description Note *</label>
              <textarea
                rows={4}
                placeholder="Enter details of the activity here..."
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivitySave}>
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CALL / EMAIL SIMULATION DIALOG --- */}
      <Dialog open={isInteractionOpen} onOpenChange={setIsInteractionOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeInteractionType === "call" ? (
                <>
                  <Phone className="h-5 w-5 text-green-500" /> Dialing Contact...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 text-blue-500" /> Composing Email...
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {activeInteractionType === "call" ? (
                `Simulating an outbound voice call to: ${activeLead?.contacts?.name} (${activeLead?.contacts?.mobile})`
              ) : (
                `Simulating a secure outbound email send to: ${activeLead?.contacts?.name} (${activeLead?.contacts?.email})`
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="border rounded-lg p-3 bg-secondary/20 flex flex-col gap-1 items-center justify-center py-6 text-center border-dashed">
              <div className={`p-4 rounded-full ${activeInteractionType === "call" ? "bg-green-500/10 text-green-500 animate-pulse" : "bg-blue-500/10 text-blue-500"} mb-3`}>
                {activeInteractionType === "call" ? <Phone className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
              </div>
              <p className="font-semibold text-sm">{activeLead?.contacts?.name}</p>
              <p className="text-xs text-muted-foreground">{activeInteractionType === "call" ? activeLead?.contacts?.mobile : activeLead?.contacts?.email}</p>
              <Badge variant="outline" className="mt-2 bg-background border-green-500/20 text-green-500 text-[10px]">
                {activeInteractionType === "call" ? "CALL CONNECTED" : "SMTP PIPELINE READY"}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                {activeInteractionType === "call" ? "Log Call Result / Discussion Details" : "Email Message / Send Description"}
              </label>
              <textarea
                rows={3}
                placeholder={activeInteractionType === "call" ? "e.g. Spoke with client. Interested in demo on Tuesday." : "e.g. Sent standard sales deck. Awaiting feedback."}
                value={interactionResult}
                onChange={(e) => setInteractionResult(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInteractionOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInteractionSave} 
              className={activeInteractionType === "call" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              {activeInteractionType === "call" ? "End & Log Call" : "Log Send Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- BULK ASSIGN AGENT DIALOG --- */}
      <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle>Bulk Assign Agent</DialogTitle>
            <DialogDescription>
              Assign {selectedLeadIds.length} selected leads to a specific agent/owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <label className="text-xs font-semibold">Select Agent (Owner) *</label>
            <select
              value={bulkAgentId}
              onChange={(e) => setBulkAgentId(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select agent...</option>
              {Array.isArray(agents) && agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignSave} disabled={!bulkAgentId}>
              Confirm Bulk Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- BULK CHANGE STAGE DIALOG --- */}
      <Dialog open={isBulkStageOpen} onOpenChange={setIsBulkStageOpen}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle>Bulk Change Stage</DialogTitle>
            <DialogDescription>
              Transition {selectedLeadIds.length} selected leads to a new pipeline stage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <label className="text-xs font-semibold">Select Stage *</label>
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select stage...</option>
              <option value="prospect">Prospect</option>
              <option value="lead">Lead</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkStageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStageSave} disabled={!bulkStage}>
              Change Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Lead Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the lead for <strong>{activeLead?.contacts?.name}</strong>?
              This will permanently delete the pipeline metrics. This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CSV IMPORT MODAL --- */}
      <BulkUploadModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entityType="lead"
      />
      
    </div>
  );
}
