"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Simple chart skeleton component
function ChartSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  );
}

// Dynamically import individual chart components
const BarChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Bar),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const DoughnutChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Doughnut),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const LineChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Line),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const PieChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Pie),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const PolarAreaChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.PolarArea),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const RadarChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Radar),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export type ChartType = "bar" | "doughnut" | "line" | "pie" | "polar" | "radar";

interface DynamicChartProps {
  type: ChartType;
  data: any;
  options?: any;
  className?: string;
}

export function DynamicChart({ type, data, options, className }: DynamicChartProps) {
  const chartProps = {
    data,
    options,
    className,
  };

  switch (type) {
    case "bar":
      return <BarChart {...chartProps} />;
    case "doughnut":
      return <DoughnutChart {...chartProps} />;
    case "line":
      return <LineChart {...chartProps} />;
    case "pie":
      return <PieChart {...chartProps} />;
    case "polar":
      return <PolarAreaChart {...chartProps} />;
    case "radar":
      return <RadarChart {...chartProps} />;
    default:
      return <BarChart {...chartProps} />;
  }
}

// Pre-configured chart options
export const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: "hsla(240,5%,50%,0.1)" }, ticks: { color: "hsla(240,5%,50%,0.6)", font: { size: 10 } } },
    x: { grid: { display: false }, ticks: { color: "hsla(240,5%,50%,0.6)", font: { size: 10 } } },
  },
};

export const DONUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const, labels: { padding: 16, usePointStyle: true, font: { size: 11 } } } },
  cutout: "65%",
};

export const RADAR_OPTIONS = {
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

export const POLAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const, labels: { padding: 12, usePointStyle: true, font: { size: 10 } } } },
  scales: {
    r: { grid: { color: "hsla(240,5%,50%,0.1)" }, ticks: { display: false } },
  },
};