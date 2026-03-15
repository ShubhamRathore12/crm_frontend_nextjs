"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Contact = {
  id: string;
  ucc_code: string | null;
  name: string;
  phone: string | null;
  email?: string | null;
};

export default function NewLeadPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [source, setSource] = useState("website");
  const [product, setProduct] = useState("");
  const [campaign, setCampaign] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api.contacts
      .list()
      .then((res) => setContacts((res.data ?? []) as Contact[]))
      .catch(() => setContacts([]));
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      if (!contactId) throw new Error("Select a contact");
      await api.leads.create({
        contact_id: contactId,
        source,
        product: product.trim() || undefined,
        campaign: campaign.trim() || undefined,
      });
      toast.success("Lead created successfully");
      setProduct("");
      setCampaign("");
    } catch (e) {
      toast.error("Failed to create lead", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Lead</h1>
        <p className="text-muted-foreground">Create a lead (mobile is mandatory at Contact level).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact *</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || ""})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="website">Website</option>
                <option value="email">Email</option>
                <option value="referral">Referral</option>
                <option value="partner">Partner</option>
                <option value="social">Social</option>
                <option value="cold_call">Cold Call</option>
                <option value="paid_ads">Paid Ads</option>
                <option value="event">Event</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign</label>
              <input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {status && <p className="text-sm text-muted-foreground">{status}</p>}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Create lead"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

