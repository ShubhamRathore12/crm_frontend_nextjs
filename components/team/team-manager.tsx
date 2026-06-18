"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "agent";
  status: "active" | "inactive";
  leadsCount?: number;
  createdAt?: string;
}

export function TeamManager() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "agent" });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await api.users.list();
      setMembers((data as any).data || []);
    } catch (err) {
      console.error("Failed to load team", err);
      setMembers([
        // Dummy data
        {
          id: "1",
          name: "John Smith",
          email: "john@example.com",
          role: "manager",
          status: "active",
          leadsCount: 24,
        },
        {
          id: "2",
          name: "Sarah Johnson",
          email: "sarah@example.com",
          role: "agent",
          status: "active",
          leadsCount: 18,
        },
        {
          id: "3",
          name: "Mike Davis",
          email: "mike@example.com",
          role: "agent",
          status: "inactive",
          leadsCount: 12,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email required");
      return;
    }

    try {
      const newMember: TeamMember = {
        id: `user_${Date.now()}`,
        name: form.name,
        email: form.email,
        role: form.role as "admin" | "manager" | "agent",
        status: "active",
        leadsCount: 0,
      };
      setMembers([...members, newMember]);
      setForm({ name: "", email: "", role: "agent" });
      setIsAddOpen(false);
      toast.success("Team member added");
    } catch (err) {
      toast.error("Failed to add member");
    }
  };

  const handleRemove = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    toast.success("Team member removed");
  };

  const roleColor = {
    admin: "bg-red-500/10 text-red-600",
    manager: "bg-blue-500/10 text-blue-600",
    agent: "bg-green-500/10 text-green-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({members.length})
        </h2>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading team...</div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{member.name}</h4>
                    <Badge
                      className={`text-xs capitalize ${roleColor[member.role]}`}
                    >
                      {member.role}
                    </Badge>
                    {member.status === "inactive" && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </div>
                  {member.leadsCount !== undefined && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {member.leadsCount} assigned leads
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Name</label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Role</label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
