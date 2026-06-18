"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Mail, Calendar, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

export function ZapierConnector() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [syncConfig, setSyncConfig] = useState({
    email: true,
    meetings: true,
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const data = await api.integrations.get("zapier").catch(() => null) ||
        (await fetch("/api/v1/zapier/status").then(r => r.json()).catch(() => null));
      setStatus(data);
    } catch (err) {
      console.error("Failed to check Zapier status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast.error("API key required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/zapier/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          email_sync: syncConfig.email,
          meeting_sync: syncConfig.meetings,
        }),
      });

      if (!response.ok) throw new Error("Failed to connect");

      toast.success("Zapier connected!");
      setApiKey("");
      setIsConnectOpen(false);
      await checkStatus();
    } catch (err) {
      toast.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Zapier? This will stop syncing meetings and emails.")) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/zapier/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to disconnect");

      toast.success("Zapier disconnected");
      await checkStatus();
    } catch (err) {
      toast.error("Disconnect failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading Zapier status...
        </CardContent>
      </Card>
    );
  }

  const connected = status?.connected;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Zapier Integration
          </CardTitle>
          {connected && <Badge className="bg-green-500/10 text-green-600">Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <>
            <div className="rounded-lg bg-muted/40 p-4 space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Connected as: </span>
                <span className="font-semibold">{status.name}</span>
              </div>
              {status.created_at && (
                <div className="text-xs text-muted-foreground">
                  Connected {new Date(status.created_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Syncing:</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Mail className="h-3 w-3" />
                    Emails
                  </Badge>
                  {status.config?.email_sync && (
                    <span className="text-xs text-green-600">Active</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Meetings
                  </Badge>
                  {status.config?.meeting_sync && (
                    <span className="text-xs text-green-600">Active</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Incoming emails and meetings will appear in contact activity timelines.
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a
                  href="https://zapier.com/apps/crm/integrations"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Manage Zaps
                </a>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Connect your CRM with Zapier to automatically sync emails and meetings from your favorite tools (Gmail, Outlook, Calendar, etc.).
            </div>

            <Button
              onClick={() => setIsConnectOpen(true)}
              className="w-full gap-2"
            >
              <Zap className="h-4 w-4" />
              Connect Zapier
            </Button>
          </>
        )}
      </CardContent>

      {/* Connect Dialog */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Connect Zapier
            </DialogTitle>
            <DialogDescription>
              Get your API key from{" "}
              <a
                href="https://zapier.com/apps/integrations"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Zapier
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">API Key</label>
              <Input
                type="password"
                placeholder="paste your Zapier API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">What to sync:</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={syncConfig.email}
                    onCheckedChange={(c) =>
                      setSyncConfig({ ...syncConfig, email: c as boolean })
                    }
                  />
                  <span className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Emails (Gmail, Outlook, etc.)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={syncConfig.meetings}
                    onCheckedChange={(c) =>
                      setSyncConfig({ ...syncConfig, meetings: c as boolean })
                    }
                  />
                  <span className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Meetings (Google Calendar, Outlook, etc.)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConnectOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={loading || !apiKey.trim()}>
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
