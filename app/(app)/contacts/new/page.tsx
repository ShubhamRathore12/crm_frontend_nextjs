"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function NewContactPage() {
  const [ucc, setUcc] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      if (!ucc.trim()) throw new Error("UCC is required");
      if (!name.trim()) throw new Error("Name is required");
      if (!mobile.trim()) throw new Error("Mobile is required");
      await api.contacts.create({
        ucc_code: ucc.trim(),
        name: name.trim(),
        phone: mobile.trim(),
        email: email.trim() || "",
        address: address.trim() || undefined,
      });
      setStatus("Contact created.");
      setUcc("");
      setName("");
      setMobile("");
      setEmail("");
      setAddress("");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Contact</h1>
        <p className="text-muted-foreground">UCC is unique. Mobile is mandatory.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">UCC code *</label>
              <input
                value={ucc}
                onChange={(e) => setUcc(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile *</label>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {status && <p className="text-sm text-muted-foreground">{status}</p>}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Create contact"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

