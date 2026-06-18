"use client";

import { useServerSettings } from "@/lib/use-server-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Save, RotateCcw, KeyRound, Clock } from "lucide-react";
import { toast } from "sonner";

type SecuritySettings = {
  require2fa: boolean;
  sessionTimeout: string; // minutes
  passwordExpiry: string; // days, "0" = never
  minPasswordLength: string;
  requireStrongPassword: boolean;
  loginAlerts: boolean;
  restrictConcurrentSessions: boolean;
  ipAllowlist: string;
};

const DEFAULTS: SecuritySettings = {
  require2fa: false,
  sessionTimeout: "60",
  passwordExpiry: "90",
  minPasswordLength: "8",
  requireStrongPassword: true,
  loginAlerts: true,
  restrictConcurrentSessions: false,
  ipAllowlist: "",
};

const TIMEOUTS = [
  ["15", "15 minutes"],
  ["30", "30 minutes"],
  ["60", "1 hour"],
  ["240", "4 hours"],
  ["480", "8 hours"],
  ["0", "Never"],
];

const EXPIRY = [
  ["30", "30 days"],
  ["60", "60 days"],
  ["90", "90 days"],
  ["180", "180 days"],
  ["0", "Never"],
];

const MIN_LENGTHS = ["6", "8", "10", "12", "16"];

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  badge,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          {label}
          {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
        </div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SecuritySettings() {
  const { settings, setSetting, save, reset, dirty, loaded, saving } = useServerSettings<SecuritySettings>(
    "security",
    DEFAULTS
  );

  if (!loaded) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      await save();
      toast.success("Security settings saved");
    } catch (e) {
      toast.error("Failed to save settings", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Authentication
          </CardTitle>
          <p className="text-sm text-muted-foreground">Control how team members sign in and stay signed in.</p>
        </CardHeader>
        <CardContent className="divide-y">
          <ToggleRow
            label="Require two-factor authentication"
            description="All users must set up 2FA to access the CRM"
            badge="Recommended"
            checked={settings.require2fa}
            onChange={(v) => setSetting("require2fa", v)}
          />
          <ToggleRow
            label="Login alerts"
            description="Email users when a new device or location signs in"
            checked={settings.loginAlerts}
            onChange={(v) => setSetting("loginAlerts", v)}
          />
          <ToggleRow
            label="Restrict concurrent sessions"
            description="Sign out other devices when a new session starts"
            checked={settings.restrictConcurrentSessions}
            onChange={(v) => setSetting("restrictConcurrentSessions", v)}
          />
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <div className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" /> Session timeout
              </div>
              <div className="text-xs text-muted-foreground">Automatically sign out after inactivity</div>
            </div>
            <Select value={settings.sessionTimeout} onValueChange={(v) => setSetting("sessionTimeout", v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEOUTS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Password Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Minimum length</Label>
              <Select value={settings.minPasswordLength} onValueChange={(v) => setSetting("minPasswordLength", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MIN_LENGTHS.map((l) => <SelectItem key={l} value={l}>{l} characters</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Password expiry</Label>
              <Select value={settings.passwordExpiry} onValueChange={(v) => setSetting("passwordExpiry", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPIRY.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="divide-y">
            <ToggleRow
              label="Require strong passwords"
              description="Enforce upper, lower, number, and symbol"
              checked={settings.requireStrongPassword}
              onChange={(v) => setSetting("requireStrongPassword", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={reset} disabled={!dirty || saving}>
          <RotateCcw className="h-4 w-4 mr-2" /> Discard
        </Button>
        <Button onClick={handleSave} disabled={!dirty || saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
