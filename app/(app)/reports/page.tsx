"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { 
  TrendingUp, 
  Users, 
  Target, 
  MessageSquare, 
  Download, 
  Filter, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, LeadStats, InteractionStats, OpportunityStats, OverallStats } from "@/lib/api";
import { cn } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ReportsSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-background/50 p-3 md:p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full animate-shimmer" />
          <div className="space-y-1.5">
            <div className="h-6 w-48 rounded animate-shimmer" />
            <div className="h-3 w-32 rounded animate-shimmer" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-md animate-shimmer" />
          <div className="h-8 w-20 rounded-md animate-shimmer" />
          <div className="h-8 w-28 rounded-md animate-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-xl shadow-black/5">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-10 w-10 rounded-xl animate-shimmer" />
                <div className="h-5 w-12 rounded animate-shimmer" />
              </div>
              <div className="h-8 w-16 rounded animate-shimmer" />
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-1 w-full rounded-full animate-shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-black/5">
          <CardHeader><div className="h-5 w-40 rounded animate-shimmer" /></CardHeader>
          <CardContent><div className="h-[300px] rounded animate-shimmer" /></CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-black/5">
          <CardHeader><div className="h-5 w-32 rounded animate-shimmer" /></CardHeader>
          <CardContent><div className="h-[300px] rounded animate-shimmer" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [overall, setOverall] = useState<OverallStats | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [interactionStats, setInteractionStats] = useState<InteractionStats | null>(null);
  const [oppStats, setOppStats] = useState<OpportunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const fetchData = useCallback(() => {
    startTransition(async () => {
      try {
        const [ov, ls, is, os] = await Promise.all([
          api.analytics.overall().catch(() => null),
          api.analytics.leads().catch(() => null),
          api.analytics.interactions().catch(() => null),
          api.analytics.opportunities().catch(() => null),
        ]);
        if (ov) setOverall(ov);
        if (ls) setLeadStats(ls);
        if (is) setInteractionStats(is);
        if (os) setOppStats(os);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <ReportsSkeleton />;

  // Helper: convert { key: value } object to [{ label, count/value }] array
  const objectToLabelArray = (obj: Record<string, number> | undefined, valueKey: "count" | "value" = "count") =>
    obj ? Object.entries(obj).map(([label, v]) => ({ label, count: v, value: v })) : [];

  // Normalize API responses — API may return arrays or { byStatus: {...} } objects
  const ls = leadStats as any;
  const growthData = Array.isArray(ls?.growth) ? ls.growth : [];
  const leadStatusArr = Array.isArray(ls?.by_status) ? ls.by_status : objectToLabelArray(ls?.byStatus);
  const leadSourceArr = Array.isArray(ls?.by_source) ? ls.by_source : objectToLabelArray(ls?.bySource);

  const os = oppStats as any;
  const oppStageArr = Array.isArray(os?.by_stage) ? os.by_stage : objectToLabelArray(os?.byStage, "value");

  const is = interactionStats as any;
  const interactionChannelArr = Array.isArray(is?.by_channel) ? is.by_channel : objectToLabelArray(is?.byChannel);

  // Chart Data Preparation
  const leadGrowthData = {
    labels: growthData.length > 0 ? growthData.map((g: any) => g.label) : leadStatusArr.map((s: any) => s.label),
    datasets: [{
      label: "New Leads",
      data: growthData.length > 0 ? growthData.map((g: any) => g.value) : leadStatusArr.map((s: any) => s.count),
      fill: true,
      borderColor: "hsl(263.4, 70%, 50.4%)",
      backgroundColor: "hsla(263.4, 70%, 50.4%, 0.1)",
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: "hsl(263.4, 70%, 50.4%)",
    }]
  };

  const leadStatusData = {
    labels: leadStatusArr.map((s: any) => s.label),
    datasets: [{
      data: leadStatusArr.map((s: any) => s.count),
      backgroundColor: [
        "hsla(263.4, 70%, 50.4%, 0.6)",
        "hsla(142.1, 70.6%, 45.3%, 0.6)",
        "hsla(37.9, 90.2%, 58.2%, 0.6)",
        "hsla(0, 84.2%, 60.2%, 0.6)",
        "hsla(198.6, 88.7%, 48.4%, 0.6)",
        "hsla(220, 70%, 50%, 0.6)",
        "hsla(340, 70%, 50%, 0.6)",
        "hsla(160, 70%, 50%, 0.6)",
      ],
      borderColor: "transparent",
      hoverOffset: 10,
    }]
  };

  const oppValueData = {
    labels: oppStageArr.map((s: any) => s.label),
    datasets: [{
      label: "Value ($)",
      data: oppStageArr.map((s: any) => s.value),
      backgroundColor: "hsla(142.1, 70.6%, 45.3%, 0.6)",
      borderRadius: 8,
    }]
  };

  const interactionChannelData = {
    labels: interactionChannelArr.map((c: any) => c.label),
    datasets: [{
      data: interactionChannelArr.map((c: any) => c.count),
      backgroundColor: [
        "hsla(198.6, 88.7%, 48.4%, 0.6)",
        "hsla(263.4, 70%, 50.4%, 0.6)",
        "hsla(37.9, 90.2%, 58.2%, 0.6)",
        "hsla(0, 84.2%, 60.2%, 0.6)",
        "hsla(142.1, 70.6%, 45.3%, 0.6)",
        "hsla(220, 70%, 50%, 0.6)",
      ],
      borderColor: "transparent",
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: { color: "hsla(240, 5%, 50%, 0.1)" },
        ticks: { color: "hsla(240, 5%, 50%, 0.7)", font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: "hsla(240, 5%, 50%, 0.7)", font: { size: 10 } }
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-background/50 p-3 md:p-4 rounded-xl border backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Performance Analytics</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest hidden sm:block">Real-time CRM Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 gap-2 font-medium">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Last 30 Days</span>
            <span className="sm:hidden">30d</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2 font-medium">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button size="sm" className="h-8 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Leads", value: overall?.leads, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12%" },
          { label: "Active Opps", value: overall?.opportunities, icon: Target, color: "text-purple-500", bg: "bg-purple-500/10", trend: "+5%" },
          { label: "Interactions", value: overall?.interactions, icon: MessageSquare, color: "text-green-500", bg: "bg-green-500/10", trend: "+24%" },
          { label: "Tasks Done", value: overall?.tasks, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10", trend: "98%" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-xl shadow-black/5 overflow-hidden group hover:-translate-y-1 transition-all duration-300 bg-card/50 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl", item.bg, item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold bg-background/50 border-primary/20 flex gap-1">
                  {item.trend.includes("+") ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ChevronRight className="h-3 w-3 text-primary" />}
                  {item.trend}
                </Badge>
              </div>
              <h3 className="text-3xl font-bold tracking-tighter">{item.value?.toLocaleString() || "0"}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{item.label}</p>
              <div className="mt-4 h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", item.bg.replace('/10', '/60'))} style={{ width: '70%' }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Lead Generation Trend</CardTitle>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Growth over the last 6 months</p>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Monthly</Badge>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <Line data={leadGrowthData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Lead Distribution</CardTitle>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">By current status</p>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center pt-0">
            <div className="relative h-full w-full">
              <Doughnut data={leadStatusData} options={{ ...chartOptions, cutout: '70%', scales: undefined }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">{ls?.total || leadStatusArr.reduce((a: number, b: any) => a + b.count, 0) || 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Opportunity Pipeline Value</CardTitle>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Forecast value by stage ($)</p>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <Bar data={oppValueData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Communication Channels</CardTitle>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Interaction volume breakdown</p>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <Doughnut data={interactionChannelData} options={{ ...chartOptions, scales: undefined }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
