"use client";

import { useEffect, useState } from "react";
import { api, FieldDefinition, CreateField } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings2 } from "lucide-react";

export function DynamicFieldsSettings() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState<CreateField>({
    entity_type: "lead",
    field_name: "",
    label: "",
    field_type: "text",
    is_required: false,
    display_order: 0,
  });

  const fetchFields = async () => {
    try {
      const data = await api.fields.list();
      setFields(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleAddField = async () => {
    try {
      await api.fields.create(newField);
      setIsAdding(false);
      setNewField({
        entity_type: "lead",
        field_name: "",
        label: "",
        field_type: "text",
        is_required: false,
        display_order: 0,
      });
      fetchFields();
    } catch (error) {
      console.error("Failed to add field:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? System fields cannot be deleted.")) return;
    try {
      await api.fields.delete(id);
      setFields(fields.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Failed to delete field:", error);
    }
  };

  if (loading) return <div>Loading field definitions...</div>;

  const leadFields = fields.filter((f) => f.entity_type === "lead");
  const contactFields = fields.filter((f) => f.entity_type === "contact");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">Define additional data points for your leads and contacts.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Field
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Lead Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leadFields.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{f.field_name} • {f.field_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {f.is_system && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                  {f.is_required && <Badge className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">Required</Badge>}
                  {!f.is_system && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Contact Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contactFields.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{f.field_name} • {f.field_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {f.is_system && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                  {f.is_required && <Badge className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">Required</Badge>}
                  {!f.is_system && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Custom Field</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={newField.entity_type} onValueChange={(val) => setNewField({...newField, entity_type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input placeholder="e.g. Budget Range" value={newField.label} onChange={(e) => setNewField({...newField, label: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Field Name (database key)</Label>
                <Input placeholder="e.g. budget_range" value={newField.field_name} onChange={(e) => setNewField({...newField, field_name: e.target.value})} />
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
              <div className="flex items-center gap-2">
                <input type="checkbox" id="req" checked={newField.is_required} onChange={(e) => setNewField({...newField, is_required: e.target.checked})} />
                <Label htmlFor="req">Is Required?</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleAddField}>Create Field</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
