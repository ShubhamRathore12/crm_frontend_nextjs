"use client";

import dynamic from "next/dynamic";
import { ChartOptions } from "chart.js";

// Dynamically import Chart.js components
const ChartComponent = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Chart),
  { ssr: false }
);

export const CHART_OPTIONS: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "top",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

export const DONUT_OPTIONS: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
    },
  },
  cutout: "75%",
};

export const RADAR_OPTIONS: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
  },
};

export const POLAR_OPTIONS: ChartOptions<"polarArea"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
    },
  },
};

interface DynamicChartProps {
  type: "bar" | "line" | "doughnut" | "pie" | "radar" | "polar";
  data: any;
  options?: any;
}

export function DynamicChart({ type, data, options }: DynamicChartProps) {
  return (
    <ChartComponent
      type={type as any}
      data={data}
      options={options}
    />
  );
}
