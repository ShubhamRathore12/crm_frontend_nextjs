"use client";

import { useState, useEffect } from "react";
import { api, type SalesForm } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormsViewProps {
  onRefresh?: () => void;
}

export function FormsView({ onRefresh }: FormsViewProps) {
  const [forms, setForms] = useState<SalesForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.salesMarketing.forms.list();
      setForms(data);
    } catch {
      setForms([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createForm = async () => {
    if (!newName.trim()) return;
    try {
      await api.salesMarketing.forms.create({ name: newName.trim(), description: newDesc.trim() });
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      load();
    } catch (e) {
      console.error("Failed to create form", e);
    }
  };

  const toggleActive = async (form: SalesForm) => {
    try {
      await api.salesMarketing.forms.update(form.id, { is_active: !form.is_active });
      load();
    } catch (e) {
      console.error("Failed to toggle form", e);
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Delete this form?")) return;
    try {
      await api.salesMarketing.forms.delete(id);
      load();
    } catch (e) {
      console.error("Failed to delete form", e);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {forms.length} form{forms.length !== 1 ? "s" : ""}
        </h3>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Create Form
        </Button>
      </div>

      {/* Create form inline */}
      {showCreate && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Form Name *</label>
            <input
              type="text"
              placeholder="Lead Generation Form"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input
              type="text"
              placeholder="Optional description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={createForm} size="sm">Create</Button>
            <Button onClick={() => setShowCreate(false)} size="sm" variant="outline">Cancel</Button>
          </div>
        </div>
      )}

      {/* Forms table */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading forms…</div>
      ) : forms.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No forms yet. Click "Create Form" to get started.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Form Name</th>
                <th className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Submitted</th>
                <th className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Open</th>
                <th className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Closed</th>
                <th className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Last Edited</th>
                <th className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forms.map((form) => (
                <tr key={form.id} className="transition-colors hover:bg-secondary/30">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{form.name}</div>
                      {form.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{form.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-medium">{form.open_count + form.closed_count}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-amber-400 font-medium">{form.open_count}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-emerald-400 font-medium">{form.closed_count}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => toggleActive(form)} className="inline-flex items-center gap-1">
                      {form.is_active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={cn("text-xs", form.is_active ? "text-emerald-400" : "text-muted-foreground")}>
                        {form.is_active ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{fmt(form.updated_at)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="rounded p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
