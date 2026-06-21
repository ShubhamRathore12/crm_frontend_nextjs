"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, Users as UsersIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type AccessModule,
  type PermAction,
  type GroupPermissionRow,
  type User,
} from "@/lib/api";
import { usePermissions } from "@/components/auth/permission-provider";

const ACTIONS: PermAction[] = ["read", "write", "edit", "delete"];

export default function AccessControlPage() {
  const { isAdmin, loading } = usePermissions();
  const [tab, setTab] = useState<"groups" | "users">("groups");

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <Shield className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-medium">Administrator access required</p>
            <p className="text-sm text-muted-foreground">
              Only admins can manage access control.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" /> Access Control
        </h1>
        <p className="text-muted-foreground text-sm">
          Control read / write / edit / delete rights per module, by group and per user.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabBtn active={tab === "groups"} onClick={() => setTab("groups")}>
          Groups
        </TabBtn>
        <TabBtn active={tab === "users"} onClick={() => setTab("users")}>
          Users
        </TabBtn>
      </div>

      {tab === "groups" ? <GroupsTab /> : <UsersTab />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " +
        (active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Groups ───────────────────────────── */

function GroupsTab() {
  const qc = useQueryClient();
  const { data: modulesData } = useQuery({
    queryKey: ["ac-modules"],
    queryFn: () => api.accessControl.modules(),
  });
  const { data: groups } = useQuery({
    queryKey: ["ac-groups"],
    queryFn: () => api.accessControl.groups(),
  });

  const modules: AccessModule[] = modulesData?.modules ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<Record<string, GroupPermissionRow>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  const selected = useMemo(
    () => groups?.find((g) => g.id === selectedId) ?? null,
    [groups, selectedId]
  );

  // Default selection + load matrix when group/modules change.
  useEffect(() => {
    if (!selectedId && groups && groups.length) setSelectedId(groups[0].id);
  }, [groups, selectedId]);

  useEffect(() => {
    if (!selected || !modules.length) return;
    const byModule: Record<string, GroupPermissionRow> = {};
    for (const m of modules) {
      const existing = selected.permissions.find((p) => p.module === m.key);
      byModule[m.key] = {
        module: m.key,
        can_read: existing?.can_read ?? false,
        can_write: existing?.can_write ?? false,
        can_edit: existing?.can_edit ?? false,
        can_delete: existing?.can_delete ?? false,
      };
    }
    setMatrix(byModule);
  }, [selected, modulesData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMutation = useMutation({
    mutationFn: () =>
      api.accessControl.setGroupPermissions(selectedId!, Object.values(matrix)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ac-groups"] });
      toast.success("Permissions saved");
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.accessControl.createGroup(newGroup),
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ["ac-groups"] });
      setCreateOpen(false);
      setNewGroup({ name: "", description: "" });
      setSelectedId(g.id);
      toast.success("Group created");
    },
    onError: (e: Error) => toast.error("Create failed", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.accessControl.deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ac-groups"] });
      setSelectedId(null);
      toast.success("Group deleted");
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  const toggle = (moduleKey: string, action: PermAction) => {
    setMatrix((prev) => {
      const row = { ...prev[moduleKey] };
      const field = (`can_${action}`) as keyof GroupPermissionRow;
      (row[field] as boolean) = !row[field];
      return { ...prev, [moduleKey]: row };
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* Group list */}
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Groups</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate();
                }}
              >
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newGroup.description}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, description: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {(groups ?? []).map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className={
                "w-full text-left rounded-md px-3 py-2 text-sm transition-colors " +
                (selectedId === g.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary")
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{g.name}</span>
                {g.is_system && (
                  <Badge variant="outline" className="text-[10px] ml-1">
                    system
                  </Badge>
                )}
              </div>
              <div className="text-xs opacity-70">{g.member_count} members</div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Matrix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {selected ? selected.name : "Select a group"}
            {selected?.description ? (
              <span className="block text-xs font-normal text-muted-foreground">
                {selected.description}
              </span>
            ) : null}
          </CardTitle>
          <div className="flex gap-2">
            {selected && !selected.is_system && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete group "${selected.name}"?`)) deleteMutation.mutate(selected.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              disabled={!selectedId || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selected ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="py-2 px-3 font-medium capitalize text-center">
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => (
                    <tr key={m.key} className="border-b border-border/50">
                      <td className="py-2 pr-4">{m.label}</td>
                      {ACTIONS.map((a) => (
                        <td key={a} className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary cursor-pointer"
                            checked={!!matrix[m.key]?.[(`can_${a}`) as keyof GroupPermissionRow]}
                            onChange={() => toggle(m.key, a)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No group selected.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────────────────────────── Users ───────────────────────────── */

type Tri = "inherit" | "allow" | "deny";

function triFrom(v: boolean | null | undefined): Tri {
  if (v === null || v === undefined) return "inherit";
  return v ? "allow" : "deny";
}
function triTo(t: Tri): boolean | null {
  if (t === "inherit") return null;
  return t === "allow";
}

function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: modulesData } = useQuery({
    queryKey: ["ac-modules"],
    queryFn: () => api.accessControl.modules(),
  });
  const { data: usersData } = useQuery({
    queryKey: ["ac-users", search],
    queryFn: () => api.users.list({ search: search || undefined }),
  });
  const { data: groups } = useQuery({
    queryKey: ["ac-groups"],
    queryFn: () => api.accessControl.groups(),
  });
  const { data: profile } = useQuery({
    queryKey: ["ac-user-perms", selectedUser],
    queryFn: () => api.accessControl.userPermissions(selectedUser!),
    enabled: !!selectedUser,
  });

  const modules: AccessModule[] = modulesData?.modules ?? [];
  const users: User[] = usersData?.data ?? [];

  const [overrides, setOverrides] = useState<Record<string, Record<PermAction, Tri>>>({});

  useEffect(() => {
    if (!profile || !modules.length) return;
    const map: Record<string, Record<PermAction, Tri>> = {};
    for (const m of modules) {
      const o = profile.overrides.find((x) => x.module === m.key);
      map[m.key] = {
        read: triFrom(o?.can_read),
        write: triFrom(o?.can_write),
        edit: triFrom(o?.can_edit),
        delete: triFrom(o?.can_delete),
      };
    }
    setOverrides(map);
  }, [profile, modulesData]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupMutation = useMutation({
    mutationFn: (groupId: string | null) =>
      api.accessControl.setUserGroup(selectedUser!, groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ac-user-perms", selectedUser] });
      toast.success("Group updated");
    },
    onError: (e: Error) => toast.error("Failed", { description: e.message }),
  });

  const saveOverrides = useMutation({
    mutationFn: () =>
      api.accessControl.setUserPermissions(
        selectedUser!,
        Object.entries(overrides).map(([module, row]) => ({
          module,
          can_read: triTo(row.read),
          can_write: triTo(row.write),
          can_edit: triTo(row.edit),
          can_delete: triTo(row.delete),
        }))
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ac-user-perms", selectedUser] });
      toast.success("Overrides saved");
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UsersIcon className="h-4 w-4" /> Users
          </CardTitle>
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="space-y-1 p-2 max-h-[60vh] overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u.id)}
              className={
                "w-full text-left rounded-md px-3 py-2 text-sm transition-colors " +
                (selectedUser === u.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary")
              }
            >
              <div className="font-medium truncate">{u.name || u.email}</div>
              <div className="text-xs opacity-70 truncate">
                {u.email} · {u.role}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        {profile ? (
          <>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {profile.user.name || profile.user.email}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {profile.user.email} · role: {profile.user.role}
                  </span>
                </CardTitle>
                <Button
                  size="sm"
                  disabled={saveOverrides.isPending}
                  onClick={() => saveOverrides.mutate()}
                >
                  {saveOverrides.isPending ? "Saving…" : "Save overrides"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Group</Label>
                <select
                  value={profile.user.group_id ?? ""}
                  onChange={(e) => groupMutation.mutate(e.target.value || null)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— No group —</option>
                  {(groups ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">
                  Group sets the baseline; overrides below win.
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium">Module</th>
                      {ACTIONS.map((a) => (
                        <th key={a} className="py-2 px-3 font-medium capitalize text-center">
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => (
                      <tr key={m.key} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          {m.label}
                          <span className="block text-[11px] text-muted-foreground">
                            effective:{" "}
                            {ACTIONS.filter((a) => profile.effective[m.key]?.[a])
                              .map((a) => a[0].toUpperCase())
                              .join("") || "—"}
                          </span>
                        </td>
                        {ACTIONS.map((a) => (
                          <td key={a} className="py-2 px-3 text-center">
                            <select
                              value={overrides[m.key]?.[a] ?? "inherit"}
                              onChange={(e) =>
                                setOverrides((prev) => ({
                                  ...prev,
                                  [m.key]: {
                                    ...prev[m.key],
                                    [a]: e.target.value as Tri,
                                  },
                                }))
                              }
                              className="h-8 rounded-md border border-input bg-background px-1 text-xs"
                            >
                              <option value="inherit">inherit</option>
                              <option value="allow">allow</option>
                              <option value="deny">deny</option>
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Select a user to manage their group and permission overrides.
          </CardContent>
        )}
      </Card>
    </div>
  );
}
