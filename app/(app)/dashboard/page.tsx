"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line, PolarArea, Radar, Pie } from "react-chartjs-2";
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
  BarChart3,
  PieChart,
  Activity,
  Hexagon,
  Circle,
  Radar as RadarIcon,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

// ── Color palette ───────────────────────────────────────────────────────────
const COLORS = [
  "hsla(173, 58%, 39%, 0.7)",
  "hsla(263, 70%, 50%, 0.7)",
  "hsla(37, 90%, 58%, 0.7)",
  "hsla(0, 84%, 60%, 0.7)",
  "hsla(198, 89%, 48%, 0.7)",
  "hsla(142, 71%, 45%, 0.7)",
  "hsla(326, 78%, 60%, 0.7)",
  "hsla(45, 93%, 47%, 0.7)",
  "hsla(262, 52%, 47%, 0.7)",
  "hsla(180, 60%, 45%, 0.7)",
];

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: "hsla(240,5%,50%,0.1)" }, ticks: { color: "hsla(240,5%,50%,0.6)", font: { size: 10 } } },
    x: { grid: { display: false }, ticks: { color: "hsla(240,5%,50%,0.6)", font: { size: 10 } } },
  },
};

const DONUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const, labels: { padding: 16, usePointStyle: true, font: { size: 11 } } } },
  cutout: "65%",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function objToArr(obj: Record<string, number> | undefined) {
  if (!obj) return [];
  return Object.entries(obj).map(([label, count]) => ({ label, count }));
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ── Shimmer skeletons ───────────────────────────────────────────────────────
function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 rounded animate-shimmer" />
        <div className="h-4 w-4 rounded animate-shimmer" />
      </CardHeader>
      <CardContent>
        <div className="h-7 w-16 rounded animate-shimmer mb-1" />
        <div className="h-3 w-20 rounded animate-shimmer" />
      </CardContent>
    </Card>
  );
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader><div className="h-4 w-28 rounded animate-shimmer" /></CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-20 rounded animate-shimmer" />
            <div className="h-4 w-8 rounded animate-shimmer" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Progress bar row ────────────────────────────────────────────────────────
function StatRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm capitalize text-muted-foreground">{label.replace(/_/g, " ")}</span>
        <span className="text-sm font-medium">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Detail Dialog ───────────────────────────────────────────────────────────
type ChartType = "bar" | "doughnut" | "line" | "pie" | "polar" | "radar";

type DialogData = {
  title: string;
  charts: {
    label: string;
    type: ChartType;
    data: { labels: string[]; values: number[] };
  }[];
  stats?: { label: string; value: string | number }[];
};

const CHART_TYPE_OPTIONS: { type: ChartType; icon: typeof BarChart3; label: string }[] = [
  { type: "bar", icon: BarChart3, label: "Bar" },
  { type: "line", icon: Activity, label: "Line" },
  { type: "doughnut", icon: Circle, label: "Donut" },
  { type: "pie", icon: PieChart, label: "Pie" },
  { type: "polar", icon: Hexagon, label: "Polar" },
  { type: "radar", icon: RadarIcon, label: "Radar" },
];

const RADAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    r: {
      grid: { color: "hsla(240,5%,50%,0.15)" },
      pointLabels: { color: "hsla(240,5%,50%,0.7)", font: { size: 10 } },
      ticks: { display: false },
    },
  },
};

const POLAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const, labels: { padding: 12, usePointStyle: true, font: { size: 10 } } } },
  scales: {
    r: { grid: { color: "hsla(240,5%,50%,0.1)" }, ticks: { display: false } },
  },
};

function ChartRenderer({ type, labels, values }: { type: ChartType; labels: string[]; values: number[] }) {
  const cleanLabels = labels.map((l) => l.replace(/_/g, " "));
  const bgColors = COLORS.slice(0, values.length);

  const barLineData = {
    labels: cleanLabels,
    datasets: [{
      label: "Value",
      data: values,
      backgroundColor: type === "line" ? COLORS[0].replace("0.7", "0.1") : bgColors,
      borderColor: type === "line" ? COLORS[0] : "transparent",
      borderRadius: type === "bar" ? 6 : 0,
      fill: type === "line",
      tension: 0.4,
      pointRadius: type === "line" ? 4 : 0,
      pointBackgroundColor: COLORS[0],
    }],
  };

  const segmentData = {
    labels: cleanLabels,
    datasets: [{ data: values, backgroundColor: bgColors, borderColor: "transparent", hoverOffset: 8 }],
  };

  switch (type) {
    case "bar":
      return <Bar data={barLineData} options={CHART_OPTS as any} />;
    case "line":
      return <Line data={barLineData} options={CHART_OPTS as any} />;
    case "doughnut":
      return <Doughnut data={segmentData} options={DONUT_OPTS as any} />;
    case "pie":
      return <Pie data={segmentData} options={{ ...DONUT_OPTS, cutout: 0 } as any} />;
    case "polar":
      return <PolarArea data={segmentData} options={POLAR_OPTS as any} />;
    case "radar":
      return <Radar data={{ labels: cleanLabels, datasets: [{ label: "Value", data: values, backgroundColor: COLORS[0].replace("0.7", "0.15"), borderColor: COLORS[0], pointBackgroundColor: COLORS[0], pointRadius: 3 }] }} options={RADAR_OPTS as any} />;
    default:
      return <Bar data={barLineData} options={CHART_OPTS as any} />;
  }
}

function ChartPanel({ chart }: { chart: DialogData["charts"][0] }) {
  const [activeType, setActiveType] = useState<ChartType>(chart.type);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 md:p-4 pb-2 border-b">
        <h4 className="text-sm font-medium">{chart.label}</h4>
        {/* Chart type switcher */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          {CHART_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setActiveType(opt.type)}
              className={`p-1.5 rounded-md transition-all ${
                activeType === opt.type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={opt.label}
            >
              <opt.icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="p-3 md:p-4">
        <div className="h-[220px] md:h-[280px]">
          <ChartRenderer type={activeType} labels={chart.data.labels} values={chart.data.values} />
        </div>
      </div>
    </div>
  );
}

function DetailDialog({ data, open, onClose }: { data: DialogData | null; open: boolean; onClose: () => void }) {
  if (!data) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">{data.title}</DialogTitle>
        </DialogHeader>

        {data.stats && data.stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
            {data.stats.map((s) => (
              <div key={s.label} className="rounded-lg border p-2.5 md:p-3 text-center">
                <div className="text-base md:text-lg font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className={`grid gap-4 ${data.charts.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {data.charts.map((chart, i) => (
            <ChartPanel key={i} chart={chart} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [dialogData, setDialogData] = useState<DialogData | null>(null);

  const { data: leadStats, isLoading: isLeadStatsLoading } = useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => api.leads.stats(),
  });

  const { data: overview, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.analytics.overview(),
  });

  // The overview response has nested byStatus/byStage/bySource/byChannel objects
  // Normalize to arrays for display
  const ov = overview as any;

  const totalLeads = ov?.leads?.total ?? leadStats?.total ?? 0;
  const leadsByStatus = objToArr(ov?.leads?.byStatus) || leadStats?.by_status || [];
  const leadsByStage = objToArr(ov?.leads?.byStage) || [];
  const leadsBySource = objToArr(ov?.bySource) || leadStats?.by_source || [];

  const totalOpps = ov?.opportunities?.total ?? 0;
  const oppsByStage = objToArr(ov?.opportunities?.byStage) || [];
  const pipelineValue = ov?.opportunities?.totalPipelineValue ?? 0;

  const totalTasks = ov?.tasks?.total ?? 0;
  const tasksByStatus = objToArr(ov?.tasks?.byStatus) || [];

  const totalInteractions = ov?.interactions?.total ?? 0;
  const interactionsByChannel = objToArr(ov?.interactions?.byChannel) || [];

  const totalContacts = ov?.contacts?.total ?? 0;
  const totalCampaigns = ov?.campaigns?.total ?? 0;
  const campaignsSent = ov?.campaigns?.totalSent ?? 0;

  const totalEmails = ov?.emails?.total ?? 0;
  const emailsRead = ov?.emails?.read ?? 0;
  const emailReadRate = ov?.emails?.readRate ?? "0%";

  // Widget definitions — each clickable to open dialog
  const widgets = [
    {
      title: "Total Leads",
      value: totalLeads,
      subtitle: leadsByStatus.find((s) => s.label === "new") ? `${leadsByStatus.find((s) => s.label === "new")!.count} new` : undefined,
      icon: UserPlus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      onClick: () => setDialogData({
        title: "Leads Breakdown",
        stats: [
          { label: "Total", value: totalLeads },
          { label: "New", value: leadsByStatus.find((s) => s.label === "new")?.count ?? 0 },
          { label: "Converted", value: leadsByStatus.find((s) => s.label === "converted")?.count ?? 0 },
        ],
        charts: [
          { label: "By Status", type: "bar", data: { labels: leadsByStatus.map((s) => s.label), values: leadsByStatus.map((s) => s.count) } },
          { label: "By Stage", type: "doughnut", data: { labels: leadsByStage.map((s) => s.label), values: leadsByStage.map((s) => s.count) } },
          { label: "By Source", type: "bar", data: { labels: leadsBySource.map((s) => s.label), values: leadsBySource.map((s) => s.count) } },
        ],
      }),
    },
    {
      title: "Contacts",
      value: totalContacts,
      subtitle: undefined,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      onClick: () => setDialogData({
        title: "Contacts Overview",
        stats: [{ label: "Total Contacts", value: totalContacts }],
        charts: [],
      }),
    },
    {
      title: "Opportunities",
      value: totalOpps,
      subtitle: pipelineValue ? formatCurrency(pipelineValue) + " pipeline" : undefined,
      icon: Target,
      color: "text-green-500",
      bg: "bg-green-500/10",
      onClick: () => setDialogData({
        title: "Opportunities Pipeline",
        stats: [
          { label: "Total", value: totalOpps },
          { label: "Pipeline Value", value: formatCurrency(pipelineValue) },
          { label: "Won", value: oppsByStage.find((s) => s.label === "won")?.count ?? 0 },
        ],
        charts: [
          { label: "By Stage", type: "doughnut", data: { labels: oppsByStage.map((s) => s.label), values: oppsByStage.map((s) => s.count) } },
          { label: "Stage Distribution", type: "bar", data: { labels: oppsByStage.map((s) => s.label), values: oppsByStage.map((s) => s.count) } },
        ],
      }),
    },
    {
      title: "Tasks",
      value: totalTasks,
      subtitle: tasksByStatus.find((s) => s.label === "pending") ? `${tasksByStatus.find((s) => s.label === "pending")!.count} pending` : undefined,
      icon: CheckSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      onClick: () => setDialogData({
        title: "Tasks Overview",
        stats: [
          { label: "Total", value: totalTasks },
          { label: "Completed", value: tasksByStatus.find((s) => s.label === "completed")?.count ?? 0 },
          { label: "In Progress", value: tasksByStatus.find((s) => s.label === "in_progress")?.count ?? 0 },
        ],
        charts: [
          { label: "By Status", type: "doughnut", data: { labels: tasksByStatus.map((s) => s.label), values: tasksByStatus.map((s) => s.count) } },
          { label: "Task Distribution", type: "bar", data: { labels: tasksByStatus.map((s) => s.label), values: tasksByStatus.map((s) => s.count) } },
        ],
      }),
    },
    {
      title: "Interactions",
      value: totalInteractions,
      subtitle: interactionsByChannel.length ? `${interactionsByChannel.length} channels` : undefined,
      icon: MessageSquare,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      onClick: () => setDialogData({
        title: "Interactions Breakdown",
        stats: [{ label: "Total", value: totalInteractions }],
        charts: [
          { label: "By Channel", type: "doughnut", data: { labels: interactionsByChannel.map((s) => s.label), values: interactionsByChannel.map((s) => s.count) } },
          { label: "Channel Volume", type: "bar", data: { labels: interactionsByChannel.map((s) => s.label), values: interactionsByChannel.map((s) => s.count) } },
        ],
      }),
    },
    {
      title: "Campaigns",
      value: totalCampaigns,
      subtitle: campaignsSent ? `${campaignsSent.toLocaleString()} sent` : undefined,
      icon: Megaphone,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      onClick: () => setDialogData({
        title: "Campaign Metrics",
        stats: [
          { label: "Total Campaigns", value: totalCampaigns },
          { label: "Total Sent", value: campaignsSent.toLocaleString() },
          { label: "Failed", value: (ov?.campaigns?.totalFailed ?? 0).toLocaleString() },
        ],
        charts: [
          { label: "Sent vs Failed", type: "doughnut", data: { labels: ["Sent", "Failed"], values: [campaignsSent, ov?.campaigns?.totalFailed ?? 0] } },
        ],
      }),
    },
    {
      title: "Emails",
      value: totalEmails,
      subtitle: `${emailReadRate} read rate`,
      icon: Mail,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      onClick: () => setDialogData({
        title: "Email Analytics",
        stats: [
          { label: "Total Emails", value: totalEmails },
          { label: "Read", value: emailsRead },
          { label: "Read Rate", value: emailReadRate },
        ],
        charts: [
          { label: "Read vs Unread", type: "doughnut", data: { labels: ["Read", "Unread"], values: [emailsRead, totalEmails - emailsRead] } },
        ],
      }),
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(pipelineValue),
      subtitle: `${totalOpps} opportunities`,
      icon: DollarSign,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      onClick: () => setDialogData({
        title: "Pipeline Value Analysis",
        stats: [
          { label: "Total Pipeline", value: formatCurrency(pipelineValue) },
          { label: "Opportunities", value: totalOpps },
        ],
        charts: [
          { label: "Value by Stage", type: "bar", data: { labels: oppsByStage.map((s) => s.label), values: oppsByStage.map((s) => s.count) } },
        ],
      }),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Click any card for detailed charts and comparisons</p>
        </div>
        {ov?.period && (
          <Badge variant="outline" className="text-xs self-start">
            Last {ov.period.days} days
          </Badge>
        )}
      </div>

      {/* Widgets grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <WidgetSkeleton key={i} />)
          : widgets.map((w) => (
              <Card
                key={w.title}
                className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                onClick={w.onClick}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    {w.title}
                  </CardTitle>
                  <div className={`p-1.5 rounded-lg ${w.bg}`}>
                    <w.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${w.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{typeof w.value === "number" ? w.value.toLocaleString() : w.value}</div>
                  <div className="flex items-center justify-between mt-1">
                    {w.subtitle ? (
                      <p className="text-[10px] md:text-xs text-muted-foreground">{w.subtitle}</p>
                    ) : <span />}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Breakdown sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Leads by Status */}
        {isLeadStatsLoading ? <StatsCardSkeleton /> : leadsByStatus.length > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => widgets[0].onClick()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Leads by Status
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {leadsByStatus.map((s, i) => (
                <StatRow key={s.label} label={s.label} count={s.count} total={totalLeads} color={COLORS[i % COLORS.length]} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Opportunities by Stage */}
        {oppsByStage.length > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => widgets[2].onClick()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Opportunities by Stage
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {oppsByStage.map((s, i) => (
                <StatRow key={s.label} label={s.label} count={s.count} total={totalOpps} color={COLORS[i % COLORS.length]} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tasks by Status */}
        {tasksByStatus.length > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => widgets[3].onClick()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Tasks by Status
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {tasksByStatus.map((s, i) => (
                <StatRow key={s.label} label={s.label} count={s.count} total={totalTasks} color={COLORS[i % COLORS.length]} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Interactions by Channel */}
        {interactionsByChannel.length > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => widgets[4].onClick()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Interactions by Channel
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {interactionsByChannel.map((s, i) => (
                <StatRow key={s.label} label={s.label} count={s.count} total={totalInteractions} color={COLORS[i % COLORS.length]} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Emails read vs unread */}
        {totalEmails > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => widgets[6].onClick()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Email Performance
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <StatRow label="Read" count={emailsRead} total={totalEmails} color={COLORS[5]} />
              <StatRow label="Unread" count={totalEmails - emailsRead} total={totalEmails} color={COLORS[3]} />
              <div className="pt-1 text-center">
                <span className="text-lg font-bold text-primary">{emailReadRate}</span>
                <span className="text-xs text-muted-foreground ml-1">read rate</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads by Source */}
        {leadsBySource.length > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => widgets[0].onClick()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Leads by Source
                <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {leadsBySource.slice(0, 6).map((s, i) => (
                <StatRow key={s.label} label={s.label} count={s.count} total={totalLeads} color={COLORS[i % COLORS.length]} />
              ))}
              {leadsBySource.length > 6 && (
                <p className="text-[10px] text-muted-foreground text-center">+{leadsBySource.length - 6} more sources</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail dialog with charts */}
      <DetailDialog data={dialogData} open={dialogData !== null} onClose={() => setDialogData(null)} />
    </div>
  );
}
