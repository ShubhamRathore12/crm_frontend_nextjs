"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  Briefcase,
  Star,
  Share2,
  MoreVertical,
  Download,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Flame,
  Plus,
  Zap,
  Target,
  Eye,
  Copy,
  LogOut,
  Activity,
  Send,
  Check
} from "lucide-react";
import Link from "next/link";

function DetailSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded animate-shimmer" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded animate-shimmer" />
          <div className="h-4 w-32 rounded animate-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="h-5 w-36 rounded animate-shimmer" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full animate-shimmer" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-16 rounded animate-shimmer" />
                  <div className="h-4 w-24 rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-4 w-24 rounded animate-shimmer" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-9 w-full rounded animate-shimmer" />
              <div className="h-9 w-full rounded animate-shimmer" />
              <div className="h-9 w-full rounded animate-shimmer" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState<any>({});

  // Task form state
  const [taskForm, setTaskForm] = useState({ subject: "", dueDate: "", priority: "medium" });

  // Email form state
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });

  // Mock data for opportunities, tasks, emails
  const [opportunities, setOpportunities] = useState<any[]>([
    { id: 1, name: "Subscription Client", type: "Product Opportunity", owner: "System", status: "Won", stage: "Won" },
    { id: 2, name: "Subscription Client", type: "Product Opportunity", owner: "System", status: "Won", stage: "Won" },
    { id: 3, name: "Kartik", type: "Product Opportunity", owner: "Sales Marketing", status: "Open", stage: "Active" },
  ]);

  const [tasks, setTasks] = useState<any[]>([
    { id: 1, subject: "Follow up call", dueDate: "2024-02-15", priority: "high", completed: false },
  ]);

  const [emails, setEmails] = useState<any[]>([
    { id: 1, subject: "Initial Contact", date: "2024-02-10", from: "system@crm.com" },
  ]);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.leads.get(id);
      setLead(data);
      setEditFormData(data);
    } catch (err) {
      console.error("Failed to fetch lead", err);
      toast.error("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const getStageBadgeColor = (stage: string) => {
    const stages: Record<string, string> = {
      prospect: "bg-blue-100 text-blue-800 border-blue-300",
      qualified: "bg-purple-100 text-purple-800 border-purple-300",
      proposal: "bg-amber-100 text-amber-800 border-amber-300",
      contacted: "bg-cyan-100 text-cyan-800 border-cyan-300",
      won: "bg-green-100 text-green-800 border-green-300",
      lost: "bg-red-100 text-red-800 border-red-300",
    };
    return stages[stage?.toLowerCase()] || "bg-slate-100 text-slate-800 border-slate-300";
  };

  const getStatusBadgeColor = (status: string) => {
    const statuses: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-slate-100 text-slate-800",
      closed: "bg-red-100 text-red-800",
    };
    return statuses[status?.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  const getScoreColor = (score: number) => {
    if (score >= 120) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 80) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  const handleSaveEdit = async () => {
    try {
      await api.leads.update(id, editFormData);
      toast.success("Lead updated successfully");
      setIsEditOpen(false);
      fetchLead();
    } catch (err) {
      toast.error("Failed to update lead");
    }
  };

  const handleAddOpportunity = async () => {
    const newOpportunity = {
      id: opportunities.length + 1,
      name: "New Opportunity",
      type: "Product Opportunity",
      owner: "Current User",
      status: "Open",
      stage: "Active"
    };
    setOpportunities([...opportunities, newOpportunity]);
    setIsOpportunityOpen(false);
    toast.success("Opportunity created");
  };

  const handleAddTask = async () => {
    if (!taskForm.subject) {
      toast.error("Task subject is required");
      return;
    }
    const newTask = {
      id: tasks.length + 1,
      ...taskForm,
      completed: false
    };
    setTasks([...tasks, newTask]);
    setIsTaskOpen(false);
    setTaskForm({ subject: "", dueDate: "", priority: "medium" });
    toast.success("Task created");
  };

  const handleSendEmail = async () => {
    if (!emailForm.subject || !emailForm.body) {
      toast.error("Subject and body are required");
      return;
    }
    const newEmail = {
      id: emails.length + 1,
      subject: emailForm.subject,
      date: new Date().toLocaleDateString(),
      from: "you@crm.com"
    };
    setEmails([...emails, newEmail]);
    setIsEmailOpen(false);
    setEmailForm({ subject: "", body: "" });
    toast.success("Email sent successfully");
  };

  if (loading) return <DetailSkeleton />;
  if (!lead) return (
    <div className="p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <p className="text-destructive font-semibold mb-4">Lead not found</p>
      <Button asChild>
        <Link href="/leads">Back to Leads</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Back Button and Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="hover:bg-muted">
              <Link href="/leads">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {(lead.contacts?.name || "L").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      {lead.contacts?.name || "Unknown Lead"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {lead.contacts?.company || "No company"} • {lead.contacts?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge className={`${getStatusBadgeColor(lead.status)} border`}>
                  {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                </Badge>
                <Badge className={`${getStageBadgeColor(lead.stage)} border`}>
                  {lead.stage?.charAt(0).toUpperCase() + lead.stage?.slice(1)}
                </Badge>
                {lead.lead_scores?.score >= 100 && (
                  <Badge className="bg-red-100 text-red-800 border-red-300 border flex items-center gap-1">
                    <Flame className="h-3 w-3" /> Hot Lead
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsStarred(!isStarred)}
              className={isStarred ? "bg-amber-50" : ""}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-amber-500 text-amber-500" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsEditOpen(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border/40 bg-card/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Score</p>
              <div className={`text-3xl font-bold ${getScoreColor(lead.lead_scores?.score || 0)}`}>
                {lead.lead_scores?.score || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Source</p>
              <p className="text-sm font-semibold capitalize">{lead.source?.replace("_", " ") || "N/A"}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm font-semibold">{new Date(lead.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Assigned To</p>
              <p className="text-sm font-semibold">{lead.assigned_to || "Unassigned"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Information Card */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 border-b border-border/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Email</p>
                      <p className="text-sm font-medium truncate mt-1">{lead.contacts?.email || "N/A"}</p>
                      <Button variant="ghost" size="sm" className="h-6 px-2 mt-1 text-xs">
                        <Mail className="h-3 w-3 mr-1" /> Send Email
                      </Button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Phone</p>
                      <p className="text-sm font-medium truncate mt-1">{lead.contacts?.mobile || "N/A"}</p>
                      <Button variant="ghost" size="sm" className="h-6 px-2 mt-1 text-xs">
                        <Phone className="h-3 w-3 mr-1" /> Call
                      </Button>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Company</p>
                      <p className="text-sm font-medium truncate mt-1">{lead.contacts?.company || "N/A"}</p>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Source</p>
                      <p className="text-sm font-medium truncate mt-1 capitalize">{lead.source?.replace("_", " ") || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Details Tabs */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-0 border-b border-border/30">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-transparent border-b border-transparent rounded-none w-full justify-start h-auto p-0">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                      <Target className="h-4 w-4 mr-2" />
                      Opportunities
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                      <Activity className="h-4 w-4 mr-2" />
                      Activity
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="p-6">
                <TabsContent value="overview" className="space-y-4 m-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Related Opportunities</h3>
                    <Button size="sm" onClick={() => setIsOpportunityOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> New Opportunity
                    </Button>
                  </div>
                  {opportunities.length > 0 ? (
                    <div className="space-y-3">
                      {opportunities.map((opp) => (
                        <div key={opp.id} className="p-4 rounded-lg border border-border/50 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium">{opp.name}</h4>
                              <p className="text-sm text-muted-foreground">{opp.type}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{opp.owner}</Badge>
                                <Badge className={opp.status === "Won" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"} variant="outline">
                                  {opp.status}
                                </Badge>
                              </div>
                            </div>
                            <Badge className={opp.stage === "Won" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}>{opp.stage}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No opportunities yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4 m-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Tasks</h3>
                    <Button size="sm" onClick={() => setIsTaskOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> New Task
                    </Button>
                  </div>
                  {tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-lg border border-border/50 bg-background/30 hover:bg-background/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <input type="checkbox" checked={task.completed} className="mt-1" />
                            <div className="flex-1">
                              <h4 className={`font-medium ${task.completed ? "line-through opacity-50" : ""}`}>{task.subject}</h4>
                              <p className="text-sm text-muted-foreground mt-1">Due: {task.dueDate}</p>
                              <Badge variant="outline" className={`text-xs mt-2 ${task.priority === "high" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
                                {task.priority} Priority
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tasks yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="email" className="space-y-4 m-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Emails</h3>
                    <Button size="sm" onClick={() => setIsEmailOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Send className="h-4 w-4" /> Send Email
                    </Button>
                  </div>
                  {emails.length > 0 ? (
                    <div className="space-y-3">
                      {emails.map((email) => (
                        <div key={email.id} className="p-4 rounded-lg border border-border/50 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{email.subject}</h4>
                              <p className="text-sm text-muted-foreground">{email.from}</p>
                              <p className="text-xs text-muted-foreground mt-1">{email.date}</p>
                            </div>
                            <Mail className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No emails yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-4 m-0">
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Activity timeline coming soon</p>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions Card */}
            <Card className="border border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Phone className="h-4 w-4" /> 
                  Call Lead
                </Button>
                <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsEmailOpen(true)}>
                  <Mail className="h-4 w-4" /> 
                  Send Email
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsTaskOpen(true)}>
                  <CheckCircle className="h-4 w-4" /> 
                  Create Task
                </Button>
                <Button className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Zap className="h-4 w-4" /> 
                  Convert to Opportunity
                </Button>
              </CardContent>
            </Card>

            {/* Lead Properties Card */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Lead Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Product Interest</p>
                  <p className="text-sm font-medium">{lead.product || "Not specified"}</p>
                </div>
                <div className="h-px bg-border/50" />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Campaign</p>
                  <p className="text-sm font-medium">{lead.campaign || "Not specified"}</p>
                </div>
                <div className="h-px bg-border/50" />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Lead ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium font-mono">{lead.id}</p>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-destructive">
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => {
                  if (confirm("Delete this lead? This action cannot be undone.")) {
                    api.leads.delete(id).then(() => {
                      toast.success("Lead deleted");
                      router.push("/leads");
                    }).catch(() => toast.error("Failed to delete lead"));
                  }
                }}>
                  <Trash2 className="h-4 w-4" /> 
                  Delete Lead
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <LogOut className="h-4 w-4" /> 
                  Archive Lead
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead details and information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Stage</label>
              <Select defaultValue={lead.stage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select defaultValue={lead.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Product</label>
              <Input defaultValue={lead.product} />
            </div>
            <div>
              <label className="text-sm font-medium">Campaign</label>
              <Input defaultValue={lead.campaign} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Opportunity Dialog */}
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

      {/* New Task Dialog */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Create a new task for this lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Subject</label>
              <Input 
                placeholder="Enter task subject" 
                value={taskForm.subject}
                onChange={(e) => setTaskForm({...taskForm, subject: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input 
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={taskForm.priority} onValueChange={(val) => setTaskForm({...taskForm, priority: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

      {/* Send Email Dialog */}
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
              <Input 
                placeholder="Enter email subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea 
                placeholder="Enter your message"
                rows={6}
                value={emailForm.body}
                onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
              <Button onClick={handleSendEmail} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4" /> Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
