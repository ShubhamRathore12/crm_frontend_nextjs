"use client";

import { useServerSettings } from "@/lib/use-server-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Globe, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type GeneralSettings = {
  companyName: string;
  website: string;
  industry: string;
  supportEmail: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  fiscalYearStart: string;
};

const DEFAULTS: GeneralSettings = {
  companyName: "",
  website: "",
  industry: "financial_services",
  supportEmail: "",
  phone: "",
  address: "",
  timezone: "Asia/Kolkata",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  fiscalYearStart: "april",
};

const INDUSTRIES = [
  ["financial_services", "Financial Services"],
  ["technology", "Technology"],
  ["real_estate", "Real Estate"],
  ["healthcare", "Healthcare"],
  ["retail", "Retail"],
  ["manufacturing", "Manufacturing"],
  ["education", "Education"],
  ["other", "Other"],
];

const TIMEZONES = ["Asia/Kolkata", "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "JPY"];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD MMM YYYY"];
const FISCAL_MONTHS = [
  ["january", "January"],
  ["april", "April"],
  ["july", "July"],
  ["october", "October"],
];

export function GeneralSettings() {
  const { settings, setSetting, save, reset, dirty, loaded, saving } = useServerSettings<GeneralSettings>(
    "general",
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
      toast.success("General settings saved");
    } catch (e) {
      toast.error("Failed to save settings", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground">Business details shown across the CRM and on outgoing communications.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={settings.companyName} onChange={(e) => setSetting("companyName", e.target.value)} placeholder="Acme Capital Pvt. Ltd." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={settings.website} onChange={(e) => setSetting("website", e.target.value)} placeholder="https://acme.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={settings.industry} onValueChange={(v) => setSetting("industry", v)}>
              <SelectTrigger id="industry"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input id="supportEmail" type="email" value={settings.supportEmail} onChange={(e) => setSetting("supportEmail", e.target.value)} placeholder="support@acme.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={settings.phone} onChange={(e) => setSetting("phone", e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={settings.address} onChange={(e) => setSetting("address", e.target.value)} placeholder="Street, City, State, ZIP" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Localization
          </CardTitle>
          <p className="text-sm text-muted-foreground">Default timezone, currency, and formats used in reports and records.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={settings.timezone} onValueChange={(v) => setSetting("timezone", v)}>
              <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Select value={settings.currency} onValueChange={(v) => setSetting("currency", v)}>
              <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={settings.dateFormat} onValueChange={(v) => setSetting("dateFormat", v)}>
              <SelectTrigger id="dateFormat"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fiscalYearStart">Fiscal Year Starts</Label>
            <Select value={settings.fiscalYearStart} onValueChange={(v) => setSetting("fiscalYearStart", v)}>
              <SelectTrigger id="fiscalYearStart"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FISCAL_MONTHS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={reset} disabled={!dirty || saving}>
          <RotateCcw className="h-4 w-4 mr-2" /> Discard
        </Button>
        <Button onClick={handleSave} disabled={!dirty || saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
