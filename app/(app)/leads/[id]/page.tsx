"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttachmentList } from "@/components/shared/attachment-list";
import { ChevronLeft, Mail, Phone, MapPin, User, Calendar } from "lucide-react";
import Link from "next/link";

export default function LeadDetailPage() {
  const { id } = useParams() as { id: string };
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leads.get(id).then(setLead).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading lead details...</div>;
  if (!lead) return <div className="p-8 text-destructive">Lead not found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leads">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Lead Details
            <Badge variant="outline">{lead.status}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">ID: {lead.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Source</p>
                  <p className="text-sm font-medium">{lead.source}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Created At</p>
                  <p className="text-sm font-medium">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Current Stage</p>
                  <p className="text-sm font-medium">{lead.stage}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Assigned To</p>
                  <p className="text-sm font-medium">{lead.assigned_to || "Unassigned"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start gap-2">
                <Phone className="h-4 w-4" /> Call Lead
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <Mail className="h-4 w-4" /> Email Lead
              </Button>
              <Button variant="default" className="justify-start gap-2 bg-green-600 hover:bg-green-700">
                Convert to Opportunity
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentList entityType="lead" entityId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
