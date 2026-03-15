"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type ImportRow = {
  ucc_code: string;
  name: string;
  mobile: string;
  email?: string | null;
  pan?: string | null;
  address?: string | null;
};

export default function ImportContactsPage() {
  const [jsonText, setJsonText] = useState(
    JSON.stringify(
      [
        { ucc_code: "UCC000001", name: "Test Contact", mobile: "9999999999", email: "test@example.com" },
      ],
      null,
      2
    )
  );
  const [status, setStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const runImport = async () => {
    setImporting(true);
    setStatus(null);
    try {
      const contacts = JSON.parse(jsonText) as ImportRow[];
      if (!Array.isArray(contacts) || contacts.length === 0) throw new Error("Paste a JSON array of contacts");
      const res = await api.contacts.import(contacts);
      setStatus(`Imported: ${res.imported}`);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Contacts</h1>
        <p className="text-muted-foreground">Paste JSON array and import via POST /contacts/import.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>JSON import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono"
          />
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
          <Button onClick={runImport} disabled={importing}>
            {importing ? "Importing…" : "Import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

