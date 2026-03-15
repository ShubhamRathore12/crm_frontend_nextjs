"use client";

import { useEffect, useState, useTransition, useOptimistic, useCallback } from "react";
import { api, FieldDefinition, CreateField } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Type, Hash, List, ToggleLeft, CalendarDays, X, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Field type config ───────────────────────────────────────────────────────
const fieldTypeConfig: Record<string, { icon: typeof Type; label: string; color: string }> = {
  text: { icon: Type, label: "Text", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  number: { icon: Hash, label: "Number", color: "text-green-500 bg-green-500/10 border-green-500/20" },
  select: { icon: List, label: "Select", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  boolean: { icon: ToggleLeft, label: "Boolean", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  date: { icon: CalendarDays, label: "Date", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
};

const entityTypes = [
  { value: "lead", label: "Lead", color: "text-blue-600" },
  { value: "contact", label: "Contact", color: "text-emerald-600" },
  { value: "opportunity", label: "Opportunity", color: "text-purple-600" },
];

// ── Shimmer Skeleton ────────────────────────────────────────────────────────
function FieldCardSkeleton() {
  return (
    <div className="flex items-start gap-2.5 p-2.5 md:p-3 rounded-lg border bg-card">
      <div className="h-7 w-7 rounded-md animate-shimmer shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded animate-shimmer" />
        <div className="h-3 w-1/2 rounded animate-shimmer" />
        <div className="flex gap-1">
          <div className="h-4 w-10 rounded animate-shimmer" />
          <div className="h-4 w-10 rounded animate-shimmer" />
          <div className="h-4 w-10 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-lg border p-2.5 md:p-3 flex flex-col items-center gap-1.5">
      <div className="h-7 w-10 rounded animate-shimmer" />
      <div className="h-3 w-16 rounded animate-shimmer" />
    </div>
  );
}

function FieldsColumnSkeleton({ color }: { color: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded animate-shimmer" />
          <div className="h-5 w-6 rounded animate-shimmer" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <FieldCardSkeleton />
        <FieldCardSkeleton />
        <FieldCardSkeleton />
      </CardContent>
    </Card>
  );
}

// ── Field Card ──────────────────────────────────────────────────────────────
function FieldCard({
  field,
  onDelete,
  isDeleting,
}: {
  field: FieldDefinition;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}) {
  const typeConfig = fieldTypeConfig[field.field_type] || fieldTypeConfig.text;
  const TypeIcon = typeConfig.icon;
  const options = Array.isArray(field.options) ? (field.options as string[]) : null;

  return (
    <div
      className={`flex items-start justify-between gap-2 p-2.5 md:p-3 rounded-lg border bg-card hover:bg-muted/20 transition-all duration-300 ${
        isDeleting ? "opacity-40 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <div className={`p-1.5 rounded-md shrink-0 ${typeConfig.color}`}>
          <TypeIcon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{field.label}</span>
            {field.is_required && (
              <span className="text-[10px] text-red-500 font-medium">*required</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono">{field.field_name}</span>
            <span className="text-[10px] text-muted-foreground">&bull;</span>
            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${typeConfig.color}`}>
              {typeConfig.label}
            </Badge>
            {field.is_system && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">System</Badge>
            )}
          </div>
          {options && options.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {options.map((opt) => (
                <span key={opt} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {opt}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {!field.is_system && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export function DynamicFieldsSettings() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FieldDefinition | null>(null);
  const [optionsInput, setOptionsInput] = useState("");
  const [newField, setNewField] = useState<CreateField>({
    entity_type: "lead",
    field_name: "",
    label: "",
    field_type: "text",
    is_required: false,
    display_order: 0,
  });

  // React 19: useTransition for non-blocking delete & create
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isCreatePending, startCreateTransition] = useTransition();

  // React 19: useOptimistic for instant UI feedback on delete
  const [optimisticFields, removeOptimistic] = useOptimistic(
    fields,
    (currentFields: FieldDefinition[], deletedId: string) =>
      currentFields.filter((f) => f.id !== deletedId)
  );

  const fetchFields = useCallback(async () => {
    try {
      const res = await api.fields.list();
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setFields(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // ── Create field with useTransition ─────────────────────────────────────
  const handleAddField = () => {
    startCreateTransition(async () => {
      try {
        const body: CreateField = { ...newField };
        if (newField.field_type === "select" && optionsInput.trim()) {
          body.options = optionsInput.split(",").map((o) => o.trim()).filter(Boolean);
        }
        body.display_order = fields.length + 1;
        await api.fields.create(body);
        setIsAdding(false);
        setNewField({
          entity_type: "lead",
          field_name: "",
          label: "",
          field_type: "text",
          is_required: false,
          display_order: 0,
        });
        setOptionsInput("");
        toast.success(`Field "${body.label}" created successfully.`);
        await fetchFields();
      } catch (error) {
        toast.error("Failed to add field", { description: (error as Error).message });
      }
    });
  };

  // ── Delete: open dialog ─────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (field) setDeleteTarget(field);
  };

  // ── Confirm delete with useOptimistic + useTransition ───────────────────
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    startDeleteTransition(async () => {
      // Optimistically remove from UI immediately
      removeOptimistic(target.id);

      try {
        await api.fields.delete(target.id);
        // Sync actual state
        setFields((prev) => prev.filter((f) => f.id !== target.id));
        toast.success(`Field "${target.label}" deleted successfully.`);
      } catch (error) {
        // Revert: refetch on failure
        toast.error("Failed to delete field", { description: (error as Error).message });
        await fetchFields();
      }
    });
  };

  // Auto-generate field_name from label
  const handleLabelChange = (label: string) => {
    const fieldName = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    setNewField({ ...newField, label, field_name: fieldName });
  };

  // ── Shimmer loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded animate-shimmer" />
            <div className="h-3 w-64 rounded animate-shimmer" />
          </div>
          <div className="h-9 w-24 rounded-md animate-shimmer" />
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <FieldsColumnSkeleton color="blue" />
          <FieldsColumnSkeleton color="emerald" />
          <FieldsColumnSkeleton color="purple" />
        </div>
      </div>
    );
  }

  // Use optimistic fields for rendering (instant delete feedback)
  const displayFields = optimisticFields;
  const leadFields = displayFields.filter((f) => f.entity_type === "lead").sort((a, b) => a.display_order - b.display_order);
  const contactFields = displayFields.filter((f) => f.entity_type === "contact").sort((a, b) => a.display_order - b.display_order);
  const opportunityFields = displayFields.filter((f) => f.entity_type === "opportunity").sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-base md:text-lg font-medium">Custom Fields</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Define additional data points for leads, contacts, and opportunities.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Field
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {entityTypes.map((et) => {
          const count = displayFields.filter((f) => f.entity_type === et.value).length;
          return (
            <div key={et.value} className="rounded-lg border p-2.5 md:p-3 text-center transition-all duration-300">
              <div className="text-lg md:text-2xl font-bold">{count}</div>
              <div className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${et.color}`}>
                {et.label} Fields
              </div>
            </div>
          );
        })}
      </div>

      {/* Field lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Lead Fields */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-semibold uppercase tracking-wider text-blue-600">
                Lead Fields
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{leadFields.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {leadFields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">No lead fields defined</p>
            ) : (
              leadFields.map((f) => <FieldCard key={f.id} field={f} onDelete={handleDelete} isDeleting={isDeletePending && !optimisticFields.some((o) => o.id === f.id)} />)
            )}
          </CardContent>
        </Card>

        {/* Contact Fields */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Contact Fields
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{contactFields.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {contactFields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">No contact fields defined</p>
            ) : (
              contactFields.map((f) => <FieldCard key={f.id} field={f} onDelete={handleDelete} isDeleting={isDeletePending && !optimisticFields.some((o) => o.id === f.id)} />)
            )}
          </CardContent>
        </Card>

        {/* Opportunity Fields */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-semibold uppercase tracking-wider text-purple-600">
                Opportunity Fields
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{opportunityFields.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunityFields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">No opportunity fields defined</p>
            ) : (
              opportunityFields.map((f) => <FieldCard key={f.id} field={f} onDelete={handleDelete} isDeleting={isDeletePending && !optimisticFields.some((o) => o.id === f.id)} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Field
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the field <strong>&quot;{deleteTarget?.label}&quot;</strong> ({deleteTarget?.field_name})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add field modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Add Custom Field</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={newField.entity_type} onValueChange={(val) => setNewField({...newField, entity_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  placeholder="e.g. Budget Range"
                  value={newField.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Field Name (database key)</Label>
                <Input
                  placeholder="e.g. budget_range"
                  value={newField.field_name}
                  onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select value={newField.field_type} onValueChange={(val) => setNewField({...newField, field_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Short Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="boolean">Checkbox</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newField.field_type === "select" && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    placeholder="e.g. Option A, Option B, Option C"
                    value={optionsInput}
                    onChange={(e) => setOptionsInput(e.target.value)}
                  />
                  {optionsInput && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {optionsInput.split(",").map((o) => o.trim()).filter(Boolean).map((opt, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="req"
                  checked={newField.is_required}
                  onChange={(e) => setNewField({...newField, is_required: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="req">Is Required?</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setIsAdding(false); setOptionsInput(""); }}>Cancel</Button>
                <Button
                  onClick={handleAddField}
                  disabled={!newField.label.trim() || !newField.field_name.trim() || isCreatePending}
                >
                  {isCreatePending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Field"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
