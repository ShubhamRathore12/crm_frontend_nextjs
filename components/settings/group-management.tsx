"use client";

import { useEffect, useState } from "react";
import { api, Team, User } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, UserPlus, X } from "lucide-react";

export function GroupManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", manager_id: "" });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [tVisible, uVisible] = await Promise.all([
        api.teams.list(),
        api.users.list()
      ]);
      setTeams(tVisible);
      setUsers((uVisible as any).data ?? uVisible as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async () => {
    try {
      await api.teams.create({
        name: newTeam.name,
        manager_id: newTeam.manager_id || undefined
      });
      setIsAdding(false);
      setNewTeam({ name: "", manager_id: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure? This will disband the team.")) return;
    try {
      await api.teams.delete(id);
      setTeams(teams.filter(t => t.id !== id));
      if (selectedTeam?.id === id) setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  const loadMembers = async (teamId: string) => {
    try {
      const data = await api.teams.members.list(teamId);
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const handleAddMember = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      await api.teams.members.add(selectedTeam.id, userId);
      loadMembers(selectedTeam.id);
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      await api.teams.members.remove(selectedTeam.id, userId);
      loadMembers(selectedTeam.id);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  if (loading) return <div>Loading group data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Group Management</h3>
          <p className="text-sm text-muted-foreground">Organize your agents into specialized teams (Sales, Support, Enterprise).</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Teams</h4>
          {teams.map((t) => (
            <div 
              key={t.id} 
              onClick={() => setSelectedTeam(t)}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md flex items-center justify-between group",
                selectedTeam?.id === t.id ? "bg-primary/5 border-primary" : "bg-card border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">ID: {t.id.slice(0, 8)}</div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {teams.length === 0 && (
            <div className="p-8 border-dashed border-2 rounded-xl text-center text-muted-foreground">
              No teams created yet.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedTeam ? (
            <Card className="border shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedTeam.name} Members</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={handleAddMember}>
                    <SelectTrigger className="w-[200px] h-8 text-xs">
                      <Plus className="h-3 w-3 mr-2" />
                      <SelectValue placeholder="Add member to team" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => !members.find(m => m.id === u.id)).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {members.map((m) => (
                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                          {m.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-sm tracking-tight">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] font-mono capitalize">{m.role}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMember(m.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic">
                      This team has no members assigned.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border-2 border-dashed">
              <Users className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Select a team to manage its members</p>
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl rounded-2xl border-primary/20">
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input 
                  placeholder="e.g. Enterprise Sales" 
                  value={newTeam.name} 
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Manager (Optional)</Label>
                <Select value={newTeam.manager_id} onValueChange={(val) => setNewTeam({...newTeam, manager_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleCreateTeam}>Create Team</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
