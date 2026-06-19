"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton loaders for dynamic content
 */

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-7 w-16 rounded bg-muted animate-pulse mb-1" />
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// export const DynamicDataTable = dynamic(
//   () => import("@tanstack/react-table").then((mod) => mod),
//   { ssr: false }
// );
