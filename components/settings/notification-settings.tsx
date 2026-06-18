"use client";

import { useServerSettings } from "@/lib/use-server-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Save, RotateCcw, Mail, Monitor, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type NotificationSettings = {
  // channels
  channelEmail: boolean;
  channelInApp: boolean;
  channelSlack: boolean;
  // events
  leadAssigned: boolean;
  leadStatusChange: boolean;
  taskDue: boolean;
  taskOverdue: boolean;
  dealStageChange: boolean;
  dealWon: boolean;
  newInteraction: boolean;
  mentions: boolean;
  // digest
  dailyDigest: boolean;
  weeklySummary: boolean;
};

const DEFAULTS: NotificationSettings = {
  channelEmail: true,
  channelInApp: true,
  channelSlack: false,
  leadAssigned: true,
  leadStatusChange: true,
  taskDue: true,
  taskOverdue: true,
  dealStageChange: true,
  dealWon: true,
  newInteraction: false,
  mentions: true,
  dailyDigest: false,
  weeklySummary: true,
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function NotificationSettings() {
  const { settings, setSetting, save, reset, dirty, loaded, saving } = useServerSettings<NotificationSettings>(
    "notifications",
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
      toast.success("Notification preferences saved");
    } catch (e) {
      toast.error("Failed to save preferences", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Delivery Channels
          </CardTitle>
          <p className="text-sm text-muted-foreground">Where you receive notifications.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { key: "channelEmail" as const, icon: Mail, label: "Email" },
            { key: "channelInApp" as const, icon: Monitor, label: "In-app" },
            { key: "channelSlack" as const, icon: MessageSquare, label: "Slack" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSetting(key, !settings[key])}
              className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                settings[key] ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" /> {label}
              </span>
              <Switch checked={settings[key]} onCheckedChange={(v) => setSetting(key, v)} />
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Notifications</CardTitle>
          <p className="text-sm text-muted-foreground">Choose which activity triggers a notification.</p>
        </CardHeader>
        <CardContent className="divide-y">
          <ToggleRow label="Lead assigned to me" checked={settings.leadAssigned} onChange={(v) => setSetting("leadAssigned", v)} />
          <ToggleRow label="Lead status changes" checked={settings.leadStatusChange} onChange={(v) => setSetting("leadStatusChange", v)} />
          <ToggleRow label="Task due soon" description="Reminder before a task's due date" checked={settings.taskDue} onChange={(v) => setSetting("taskDue", v)} />
          <ToggleRow label="Task overdue" checked={settings.taskOverdue} onChange={(v) => setSetting("taskOverdue", v)} />
          <ToggleRow label="Deal stage changes" checked={settings.dealStageChange} onChange={(v) => setSetting("dealStageChange", v)} />
          <ToggleRow label="Deal won" description="Celebrate closed-won opportunities" checked={settings.dealWon} onChange={(v) => setSetting("dealWon", v)} />
          <ToggleRow label="New interaction received" checked={settings.newInteraction} onChange={(v) => setSetting("newInteraction", v)} />
          <ToggleRow label="Mentions" description="When someone @mentions you in a note" checked={settings.mentions} onChange={(v) => setSetting("mentions", v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summaries</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <ToggleRow label="Daily digest" description="A morning summary of your pipeline and tasks" checked={settings.dailyDigest} onChange={(v) => setSetting("dailyDigest", v)} />
          <ToggleRow label="Weekly summary" description="Performance recap every Monday" checked={settings.weeklySummary} onChange={(v) => setSetting("weeklySummary", v)} />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={reset} disabled={!dirty || saving}>
          <RotateCcw className="h-4 w-4 mr-2" /> Discard
        </Button>
        <Button onClick={handleSave} disabled={!dirty || saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
