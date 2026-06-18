"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Video, ExternalLink, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Status = {
  connected: boolean;
  mode: string;
  oauth_available: boolean;
} | null;

/**
 * Connects the CRM to Google Calendar so meeting links are real, joinable
 * Google Meet URLs and calls are scheduled on Google Calendar.
 *
 * Flow: request a consent URL -> open Google -> Google redirects back to
 * /settings with ?code -> the settings page calls google.connect(code).
 */
export function GoogleCalendarConnector() {
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await api.integrations.google.status();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle the OAuth redirect (?code=...) when Google sends the user back here.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && params.get("scope")?.includes("calendar")) {
      setWorking(true);
      const redirectUri = `${window.location.origin}/settings`;
      api.integrations.google
        .connect(code, redirectUri)
        .then(() => {
          toast.success("Google Calendar connected");
          window.history.replaceState({}, "", "/settings");
          refresh();
        })
        .catch((e) => toast.error((e as Error).message || "Connection failed"))
        .finally(() => setWorking(false));
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleConnect = async () => {
    setWorking(true);
    try {
      const redirectUri = `${window.location.origin}/settings`;
      const { url } = await api.integrations.google.authUrl(redirectUri);
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message || "Could not start Google connect");
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Google Calendar? Meeting links will fall back to placeholders.")) return;
    setWorking(true);
    try {
      await api.integrations.google.disconnect();
      toast.success("Google Calendar disconnected");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const connected = status?.connected;
  const serviceAccount = status?.mode === "service_account";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-500" />
            Google Calendar & Meet
          </CardTitle>
          {connected && <Badge className="bg-green-500/10 text-green-600">Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking status...</p>
        ) : connected ? (
          <>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Video className="h-4 w-4" />
              Meeting links create real Google Meet calls and appear on Google Calendar.
            </p>
            <p className="text-xs text-muted-foreground">
              Mode: <span className="font-mono">{serviceAccount ? "Workspace service account" : "OAuth"}</span>
            </p>
            {!serviceAccount && (
              <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={working}>
                <X className="h-4 w-4 mr-1" /> Disconnect
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Connect Google so clicking a meeting link opens a real Google Meet and the call is
              scheduled on Google Calendar.
            </p>
            {status?.oauth_available ? (
              <Button onClick={handleConnect} disabled={working} className="w-full gap-2">
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Connect Google Calendar
              </Button>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
                (or a Workspace service account) in the backend environment to enable this.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
