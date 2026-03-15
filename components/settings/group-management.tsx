"use client";

import { useCallback, useEffect, useState, useTransition, useOptimistic } from "react";
import { api, Team, User } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Users, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Shimmer Skeletons ───────────────────────────────────────────────────────
function TeamCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full animate-shimmer" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded animate-shimmer" />
          <div className="h-3 w-20 rounded animate-shimmer" />
        </div>
      </div>
      <div className="h-8 w-8 rounded animate-shimmer" />
    </div>
  );
}

function MemberRowSkeleton() {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full animate-shimmer" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded animate-shimmer" />
          <div className="h-3 w-36 rounded animate-shimmer" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-14 rounded animate-shimmer" />
        <div className="h-8 w-8 rounded animate-shimmer" />
      </div>
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1.5">
          <div className="h-5 w-40 rounded animate-shimmer" />
          <div className="h-4 w-72 rounded animate-shimmer" />
        </div>
        <div className="h-9 w-28 rounded-md animate-shimmer" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="h-4 w-16 rounded animate-shimmer" />
          <TeamCardSkeleton />
          <TeamCardSkeleton />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <div className="h-5 w-36 rounded animate-shimmer" />
            </CardHeader>
            <CardContent className="p-0 divide-y">
              <MemberRowSkeleton />
              <MemberRowSkeleton />
              <MemberRowSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export function GroupManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", manager_id: "" });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const [isCreatePending, startCreateTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isMemberPending, startMemberTransition] = useTransition();

  // React 19: useOptimistic for instant team removal
  const [optimisticTeams, removeOptimisticTeam] = useOptimistic(
    teams,
    (current: Team[], deletedId: string) => current.filter((t) => t.id !== deletedId)
  );

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTeam = () => {
    startCreateTransition(async () => {
      try {
        await api.teams.create({
          name: newTeam.name,
          manager_id: newTeam.manager_id || undefined
        });
        setIsAdding(false);
        setNewTeam({ name: "", manager_id: "" });
        toast.success(`Team "${newTeam.name}" created successfully.`);
        await fetchData();
      } catch (error) {
        toast.error("Failed to create team", { description: (error as Error).message });
      }
    });
  };

  const handleDeleteTeam = (team: Team) => {
    setDeleteTarget(team);
  };

  const confirmDeleteTeam = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    startDeleteTransition(async () => {
      removeOptimisticTeam(target.id);
      try {
        await api.teams.delete(target.id);
        setTeams((prev) => prev.filter((t) => t.id !== target.id));
        if (selectedTeam?.id === target.id) {
          setSelectedTeam(null);
          setMembers([]);
        }
        toast.success(`Team "${target.name}" deleted.`);
      } catch (error) {
        toast.error("Failed to delete team", { description: (error as Error).message });
        await fetchData();
      }
    });
  };

  const loadMembers = useCallback(async (teamId: string) => {
    setMembersLoading(true);
    try {
      const data = await api.teams.members.list(teamId);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTeam) loadMembers(selectedTeam.id);
  }, [selectedTeam, loadMembers]);

  const handleAddMember = (userId: string) => {
    if (!selectedTeam) return;
    startMemberTransition(async () => {
      try {
        await api.teams.members.add(selectedTeam.id, userId);
        toast.success("Member added to team.");
        await loadMembers(selectedTeam.id);
      } catch (error) {
        toast.error("Failed to add member", { description: (error as Error).message });
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (!selectedTeam) return;
    startMemberTransition(async () => {
      try {
        await api.teams.members.remove(selectedTeam.id, userId);
        toast.success("Member removed from team.");
        await loadMembers(selectedTeam.id);
      } catch (error) {
        toast.error("Failed to remove member", { description: (error as Error).message });
      }
    });
  };

  if (loading) return <GroupSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-base md:text-lg font-medium">Group Management</h3>
          <p className="text-xs md:text-sm text-muted-foreground">Organize your agents into specialized teams (Sales, Support, Enterprise).</p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" /> Create Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Teams</h4>
          {optimisticTeams.map((t) => (
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
                onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {optimisticTeams.length === 0 && (
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
                  <Select onValueChange={handleAddMember} disabled={isMemberPending}>
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
                  {membersLoading ? (
                    <>
                      <MemberRowSkeleton />
                      <MemberRowSkeleton />
                    </>
                  ) : (
                    <>
                      {members.map((m) => (
                        <div key={m.id} className={cn(
                          "p-4 flex items-center justify-between hover:bg-muted/20 transition-colors",
                          isMemberPending && "opacity-60"
                        )}>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveMember(m.id)}
                              disabled={isMemberPending}
                            >
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
                    </>
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

      {/* Delete team confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.name}&quot;</strong>? This will disband the team and remove all member associations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteTeam}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create team modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl rounded-2xl border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create New Team</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
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
                <Button onClick={handleCreateTeam} disabled={!newTeam.name.trim() || isCreatePending}>
                  {isCreatePending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    "Create Team"
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
