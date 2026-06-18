"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Integration } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slack, Send, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}/…/${u.pathname.split("/").pop()?.slice(0, 6) ?? ""}…`;
  } catch {
    return url.slice(0, 24) + "…";
  }
}

export function SlackConnector() {
  const [connection, setConnection] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channel, setChannel] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const list = await api.integrations.connections.list();
      const slack = list.find((c) => c.provider === "slack") ?? null;
      setConnection(slack);
    } catch (err) {
      console.error("Failed to load Slack status", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleConnect = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Incoming webhook URL required");
      return;
    }
    setSaving(true);
    try {
      await api.integrations.connections.create({
        provider: "slack",
        name: "Slack Incoming Webhook",
        config: channel.trim()
          ? { webhook_url: webhookUrl.trim(), channel: channel.trim() }
          : { webhook_url: webhookUrl.trim() },
      });
      toast.success("Slack connected");
      setWebhookUrl("");
      setChannel("");
      setEditing(false);
      await checkStatus();
    } catch (err) {
      toast.error((err as Error).message || "Connection failed");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await api.integrations.slackNotify(
        "✅ Test message from your CRM — Slack integration is working!",
        (connection?.config?.channel as string) || undefined
      );
      toast.success("Test message sent to Slack");
    } catch (err) {
      toast.error((err as Error).message || "Failed to send test message");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    if (!confirm("Disconnect Slack? Notifications will no longer be posted.")) return;
    setSaving(true);
    try {
      await api.integrations.delete(connection.id);
      toast.success("Slack disconnected");
      setConnection(null);
    } catch (err) {
      toast.error((err as Error).message || "Disconnect failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground text-sm">Loading Slack status...</CardContent>
      </Card>
    );
  }

  const connected = !!connection;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Slack className="h-5 w-5 text-[#4A154B] dark:text-[#ECB22E]" />
            Slack
          </CardTitle>
          {connected && <Badge className="bg-green-500/10 text-green-600">Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <>
            <div className="rounded-lg bg-muted/40 p-4 space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Webhook: </span>
                <span className="font-mono text-xs">
                  {maskUrl((connection.config?.webhook_url as string) ?? "")}
                </span>
              </div>
              {connection.config?.channel ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Channel: </span>
                  <span className="font-semibold">{connection.config.channel as string}</span>
                </div>
              ) : null}
              {connection.created_at && (
                <div className="text-xs text-muted-foreground">
                  Connected {new Date(connection.created_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              New leads and workflow events can post notifications to your Slack channel.
            </p>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleTest} disabled={testing}>
                <Send className="h-4 w-4" />
                {testing ? "Sending..." : "Send test message"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
          </>
        ) : editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Incoming Webhook URL</label>
              <Input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">
                Channel <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="#sales"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConnect} disabled={saving}>
                {saving ? "Connecting..." : "Connect"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setWebhookUrl("");
                  setChannel("");
                }}
              >
                Cancel
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 ml-auto" asChild>
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Get a webhook
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Post notifications to channels via incoming webhooks.
            </p>
            <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Slack className="h-4 w-4" />
              Connect Slack
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
