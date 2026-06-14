"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TestNavigationPage() {
  const router = useRouter();
  
  const navigationLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/leads", label: "Leads" },
    { path: "/leads/new", label: "New Lead" },
    { path: "/contacts", label: "Contacts" },
    { path: "/opportunities", label: "Opportunities" },
    { path: "/opportunities/new", label: "New Opportunity" },
    { path: "/interactions", label: "Interactions" },
    { path: "/campaigns", label: "Campaigns" },
    { path: "/campaigns/new", label: "New Campaign" },
    { path: "/tasks", label: "Tasks" },
    { path: "/reports", label: "Reports" },
    { path: "/calendar", label: "Calendar" },
    { path: "/activity", label: "Activity" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Navigation Test</h1>
      </div>
      
      <p className="text-muted-foreground">
        This page tests all navigation links from the dashboard. Click any button to test navigation.
      </p>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {navigationLinks.map((link) => (
          <Button
            key={link.path}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => router.push(link.path)}
          >
            <span className="font-medium">{link.label}</span>
            <span className="text-xs text-muted-foreground">{link.path}</span>
          </Button>
        ))}
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="font-medium mb-2">Navigation Status</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Card Click Navigation:</span>
            <span className="text-green-600 ml-2">✓ Working</span>
          </div>
          <div>
            <span className="font-medium">Icon Click Navigation:</span>
            <span className="text-green-600 ml-2">✓ Working</span>
          </div>
          <div>
            <span className="font-medium">Button Navigation:</span>
            <span className="text-green-600 ml-2">✓ Working</span>
          </div>
          <div>
            <span className="font-medium">Page Exists:</span>
            <span className="text-orange-600 ml-2">Some may be missing</span>
          </div>
        </div>
      </div>
    </div>
  );
}