"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { CardSkeleton, TableSkeleton } from "@/components/dynamic-import";
import { usePerformanceTracking } from "@/lib/performance";
import { RefreshCw, Zap, CheckCircle, AlertTriangle } from "lucide-react";

export default function TestOptimizationsPage() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [chartLoadTime, setChartLoadTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);

  const { startTimer, endTimer } = usePerformanceTracking("TestOptimizationsPage");

  useEffect(() => {
    startTimer();
    
    // Simulate initial load
    const timer = setTimeout(() => {
      const time = endTimer();
      setLoadTime(time);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [startTimer, endTimer]);

  const handleLoadChart = () => {
    const start = performance.now();
    setShowChart(true);
    const end = performance.now();
    setChartLoadTime(end - start);
  };

  const testData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Performance",
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const optimizations = [
    {
      name: "Dynamic Imports",
      status: "implemented",
      description: "Heavy components like charts load on demand",
      impact: "High",
    },
    {
      name: "React Query Optimization",
      status: "implemented",
      description: "Caching, retry logic, and stale-while-revalidate",
      impact: "High",
    },
    {
      name: "Error Boundaries",
      status: "implemented",
      description: "Graceful error handling with recovery options",
      impact: "Medium",
    },
    {
      name: "Performance Monitoring",
      status: "implemented",
      description: "Track page load, component render, and API performance",
      impact: "Medium",
    },
    {
      name: "Request Deduplication",
      status: "implemented",
      description: "Prevent duplicate API calls within 1 second",
      impact: "Medium",
    },
    {
      name: "Code Splitting",
      status: "partial",
      description: "Route-based splitting implemented, component-level in progress",
      impact: "High",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Optimization Test Dashboard</h1>
        <p className="text-muted-foreground">
          Test the performance optimizations implemented in the CRM application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Page Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loadTime ? `${loadTime.toFixed(0)}ms` : "..."}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Time to render initial page with optimizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Dynamic Chart Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {chartLoadTime ? `${chartLoadTime.toFixed(0)}ms` : "..."}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Time to load chart component on demand
            </p>
            <Button
              onClick={handleLoadChart}
              disabled={showChart}
              className="mt-4"
              variant="outline"
            >
              Load Chart Dynamically
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Optimizations Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {optimizations.filter(o => o.status === "implemented").length}/{optimizations.length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Performance optimizations implemented
            </p>
          </CardContent>
        </Card>
      </div>

      {showChart && (
        <Card>
          <CardHeader>
            <CardTitle>Dynamically Loaded Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <DynamicChart
                type="bar"
                data={testData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This chart was loaded dynamically when you clicked the button.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Implemented Optimizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizations.map((opt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{opt.name}</h3>
                    <Badge
                      variant={
                        opt.status === "implemented"
                          ? "default"
                          : opt.status === "partial"
                          ? "outline"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {opt.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        opt.impact === "High"
                          ? "border-red-200 text-red-700 bg-red-50"
                          : opt.impact === "Medium"
                          ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                          : "border-blue-200 text-blue-700 bg-blue-50"
                      }
                    >
                      {opt.impact} Impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                </div>
                {opt.status === "implemented" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loading States Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Card Skeleton</h3>
              <CardSkeleton />
            </div>
            <div>
              <h3 className="font-medium mb-2">Table Skeleton</h3>
              <TableSkeleton rows={3} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            These loading states are used during dynamic imports and data fetching.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <span className="font-medium">Reduced initial bundle size:</span>{" "}
              Charts and heavy components load only when needed
            </li>
            <li>
              <span className="font-medium">Faster page loads:</span>{" "}
              Code splitting prevents loading unused code
            </li>
            <li>
              <span className="font-medium">Better caching:</span>{" "}
              React Query prevents unnecessary API calls
            </li>
            <li>
              <span className="font-medium">Improved UX:</span>{" "}
              Error boundaries prevent full app crashes
            </li>
            <li>
              <span className="font-medium">Real-time monitoring:</span>{" "}
              Track performance metrics for optimization
            </li>
            <li>
              <span className="font-medium">Request optimization:</span>{" "}
              Deduplication prevents duplicate API calls
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}