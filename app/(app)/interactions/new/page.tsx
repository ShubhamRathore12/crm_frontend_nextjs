"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Contact = { id: string; name: string; phone: string | null };

export default function NewInteractionPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
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
      if (!subject.trim()) throw new Error("Subject is required");
      await api.interactions.create({
        contact_id: contactId,
        channel,
        subject: subject.trim(),
        priority,
      });
      setStatus("Interaction created.");
      setSubject("");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Interaction</h1>
        <p className="text-muted-foreground">Create a customer service interaction/ticket.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interaction details</CardTitle>
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
              <label className="text-sm font-medium">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject *</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {status && <p className="text-sm text-muted-foreground">{status}</p>}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Create interaction"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

