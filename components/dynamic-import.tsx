"use client";

import dynamic from "next/dynamic";
import { ComponentType, ReactNode, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface DynamicImportOptions {
  loading?: ReactNode;
  ssr?: boolean;
}

// Default loading component
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading component...</p>
      </div>
    </div>
  );
}

// Skeleton loading component for cards
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-20 bg-muted rounded" />
      </div>
    </div>
  );
}

// Skeleton loading component for tables
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="h-10 bg-muted rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded" />
      ))}
    </div>
  );
}

// Skeleton loading component for charts
export function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-40 bg-muted rounded" />
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// Main dynamic import helper
export function dynamicImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
) {
  const {
    loading = <DefaultLoading />,
    ssr = false,
  } = options;

  return dynamic(importFunc, {
    loading: () => loading,
    ssr,
  });
}

// Hook for lazy loading with intersection observer
export function useLazyLoad<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isVisible };
}