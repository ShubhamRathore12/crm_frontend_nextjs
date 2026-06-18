"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Integration } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Copy, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

export function CalendlyConnector() {
  const [connection, setConnection] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const list = await api.integrations.connections.list();
      const calendly = list.find((c) => c.provider === "calendly") ?? null;
      setConnection(calendly);
    } catch (err) {
      console.error("Failed to load Calendly status", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSave = async () => {
    if (!link.trim()) {
      toast.error("Scheduling link required");
      return;
    }
    setSaving(true);
    try {
      await api.integrations.connections.create({
        provider: "calendly",
        name: "Calendly",
        config: { scheduling_link: link.trim() },
      });
      toast.success("Calendly link saved");
      setLink("");
      setEditing(false);
      await checkStatus();
    } catch (err) {
      toast.error((err as Error).message || "Failed to save link");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    if (!confirm("Remove Calendly link?")) return;
    setSaving(true);
    try {
      await api.integrations.delete(connection.id);
      toast.success("Calendly removed");
      setConnection(null);
    } catch (err) {
      toast.error((err as Error).message || "Failed to remove");
    } finally {
      setSaving(false);
    }
  };

  const schedulingLink = (connection?.config?.scheduling_link as string) ?? "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(schedulingLink);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground text-sm">Loading Calendly status...</CardContent>
      </Card>
    );
  }

  const connected = !!connection;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#006BFF]" />
            Calendly
          </CardTitle>
          {connected && <Badge className="bg-green-500/10 text-green-600">Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <>
            <div className="rounded-lg bg-muted/40 p-4 space-y-1">
              <div className="text-sm break-all">
                <span className="text-muted-foreground">Link: </span>
                <span className="font-mono text-xs">{schedulingLink}</span>
              </div>
              {connection.created_at && (
                <div className="text-xs text-muted-foreground">
                  Added {new Date(connection.created_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Use &quot;Arrange meeting&quot; on a contact to send this scheduling link.
            </p>

            <div className="flex gap-2 pt-1 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href={schedulingLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </>
        ) : editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Scheduling Link</label>
              <Input
                type="url"
                placeholder="https://calendly.com/your-name/30min"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setLink("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Your scheduling link for arranging meetings.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Calendar className="h-4 w-4" />
              Add Calendly link
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
