"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttachmentList } from "@/components/shared/attachment-list";
import { ChevronLeft, MessageSquare, User, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function InteractionDetailPage() {
  const { id } = useParams() as { id: string };
  const [interaction, setInteraction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.interactions.get(id).then(setInteraction).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading interaction details...</div>;
  if (!interaction) return <div className="p-8 text-destructive">Interaction not found.</div>;

  const priorityColor = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-orange-500/10 text-orange-500",
    high: "bg-red-500/10 text-red-500",
  }[interaction.priority as "low" | "medium" | "high"] || "bg-muted text-muted-foreground";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/interactions">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Interaction Details
            <Badge className={priorityColor}>{interaction.priority} Priority</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">ID: {interaction.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h3 className="font-semibold mb-2">{interaction.subject}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Channel: <span className="text-foreground font-medium uppercase">{interaction.channel}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(interaction.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium uppercase">{interaction.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Customer & Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Contact ID</p>
                  <Link href={`/contacts/${interaction.contact_id}`} className="font-medium text-primary hover:underline">
                    {interaction.contact_id.slice(0, 8)}...
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Assigned Agent</p>
                  <p className="font-medium">{interaction.assigned_to || "Unassigned"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentList entityType="interaction" entityId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
