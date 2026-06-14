"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  UserPlus,
  MessageSquare,
  Target,
  Mail,
  CheckSquare,
  Megaphone,
  Users,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  Percent,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Dashboard Widget Component
interface DashboardWidgetProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
  navigateTo?: string;
}

function DashboardWidget({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  trend = "neutral",
  onClick,
  navigateTo
}: DashboardWidgetProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (navigateTo) {
      router.push(navigateTo);
    } else if (onClick) {
      onClick();
    }
  };
  
  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigateTo) {
      router.push(navigateTo);
    } else if (onClick) {
      onClick();
    }
  };
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 border-l-4 group"
      style={{ borderLeftColor: color }}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {navigateTo && (
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <h3 className="text-2xl font-bold">{value}</h3>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {change}
                </span>
                {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-600" />}
                {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-600" />}
              </div>
            )}
          </div>
          <button
            onClick={handleIconClick}
            className={`p-2 rounded-lg ${color.replace("text-", "bg-")}20 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/30`}
            aria-label={`View ${title}`}
          >
            <Icon className={`h-6 w-6 ${color}`} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Item Component
interface ActivityItemProps {
  user: string;
  action: string;
  time: string;
  icon: React.ElementType;
}

function ActivityItem({ user, action, time, icon: Icon }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="p-2 rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium">{user}</span> {action}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("7d");
  
  // Fetch dashboard data
  const { data: overview, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.analytics.overview(),
  });

  const { data: leadStats, isLoading: isLeadStatsLoading } = useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => api.leads.stats(),
  });

  // Mock data for now
  const dashboardData = {
    totalLeads: overview?.leads?.total || leadStats?.total || 1247,
    totalContacts: overview?.contacts?.total || 856,
    totalOpportunities: overview?.opportunities?.total || 89,
    pipelineValue: overview?.opportunities?.totalPipelineValue || 1245000,
    totalTasks: overview?.tasks?.total || 45,
    totalInteractions: overview?.interactions?.total || 312,
    emailOpenRate: "78%",
    conversionRate: "24%",
  };

  const leadsByStatus = [
    { label: "New", count: 342, color: "text-blue-500" },
    { label: "Contacted", count: 218, color: "text-orange-500" },
    { label: "Qualified", count: 156, color: "text-green-500" },
    { label: "Won", count: 89, color: "text-purple-500" },
  ];

  const recentActivities = [
    { user: "Sarah Chen", action: "created a new lead", time: "2 min ago", icon: UserPlus },
    { user: "Michael Rodriguez", action: "updated opportunity status", time: "15 min ago", icon: Target },
    { user: "Alex Johnson", action: "sent email campaign", time: "30 min ago", icon: Mail },
    { user: "Emma Wilson", action: "completed task", time: "1 hour ago", icon: CheckSquare },
    { user: "David Lee", action: "added new contact", time: "2 hours ago", icon: Users },
  ];

  const topSources = [
    { source: "Website Form", count: 342, percent: 27 },
    { source: "Email Campaign", count: 218, percent: 17 },
    { source: "Social Media", count: 189, percent: 15 },
    { source: "Referral", count: 156, percent: 12 },
    { source: "Event", count: 89, percent: 7 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your CRM.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            {["Today", "7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/test-navigation")}
            className="text-xs"
          >
            Test Navigation
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardWidget
          title="Total Leads"
          value={dashboardData.totalLeads.toLocaleString()}
          change="+12.5%"
          trend="up"
          icon={UserPlus}
          color="text-blue-500"
          navigateTo="/leads"
        />
        <DashboardWidget
          title="Pipeline Value"
          value={`$${(dashboardData.pipelineValue / 1000).toFixed(0)}K`}
          change="+8.2%"
          trend="up"
          icon={DollarSign}
          color="text-green-500"
          navigateTo="/opportunities"
        />
        <DashboardWidget
          title="Open Tasks"
          value={dashboardData.totalTasks}
          change="-3"
          trend="down"
          icon={CheckSquare}
          color="text-orange-500"
          navigateTo="/tasks"
        />
        <DashboardWidget
          title="Conversion Rate"
          value={dashboardData.conversionRate}
          change="+2.4%"
          trend="up"
          icon={Percent}
          color="text-purple-500"
          navigateTo="/reports"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardWidget
          title="Contacts"
          value={dashboardData.totalContacts.toLocaleString()}
          change="+5.1%"
          trend="up"
          icon={Users}
          color="text-cyan-500"
          navigateTo="/contacts"
        />
        <DashboardWidget
          title="Opportunities"
          value={dashboardData.totalOpportunities}
          change="+2"
          trend="up"
          icon={Target}
          color="text-emerald-500"
          navigateTo="/opportunities"
        />
        <DashboardWidget
          title="Interactions"
          value={dashboardData.totalInteractions}
          change="+23"
          trend="up"
          icon={MessageSquare}
          color="text-amber-500"
          navigateTo="/interactions"
        />
        <DashboardWidget
          title="Email Open Rate"
          value={dashboardData.emailOpenRate}
          change="+1.2%"
          trend="up"
          icon={Eye}
          color="text-pink-500"
          navigateTo="/campaigns"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Leads Breakdown */}
        <Card 
          className="lg:col-span-2 cursor-pointer hover:shadow-lg transition-all group"
          onClick={() => router.push("/leads")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leads Overview</CardTitle>
                <CardDescription>Lead distribution by status and source</CardDescription>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Leads by Status */}
              <div>
                <h4 className="font-medium mb-3">Leads by Status</h4>
                <div className="space-y-2">
                  {leadsByStatus.map((status) => (
                    <div key={status.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                        <span className="text-sm">{status.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{status.count}</span>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${status.color.replace("text-", "bg-")}`}
                            style={{ width: `${(status.count / dashboardData.totalLeads) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Sources */}
              <div>
                <h4 className="font-medium mb-3">Top Lead Sources</h4>
                <div className="space-y-2">
                  {topSources.map((source) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <span className="text-sm">{source.source}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{source.count}</span>
                        <span className="text-xs text-muted-foreground">{source.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentActivities.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => router.push("/activity")}
              >
                View All Activity
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/leads/new")}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Lead
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/opportunities/new")}
              >
                <Target className="h-4 w-4 mr-2" />
                Create Opportunity
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/campaigns/new")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Campaign
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/calendar")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Lead Response Time</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 bg-green-50">
                    2.4 hours
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Task Completion</span>
                  </div>
                  <Badge variant="outline" className="text-blue-600 bg-blue-50">
                    84%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Sales Growth</span>
                  </div>
                  <Badge variant="outline" className="text-purple-600 bg-purple-50">
                    +24%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Deal Size</p>
                <p className="text-xl font-bold">$14,250</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sales Cycle</p>
                <p className="text-xl font-bold">28 days</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold">32%</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}