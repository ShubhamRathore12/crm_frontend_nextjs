"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Shield, UserPlus } from "lucide-react";
import { api, User } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  agent: "bg-green-500/10 text-green-500 border-green-500/20",
  viewer: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const columns: DataTableColumn<User>[] = [
  {
    key: "name",
    header: "Name",
    width: 180,
    searchable: true,
    filterValue: (user) => user.name ?? "",
    render: (user) => <span className="font-medium">{user.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    searchable: true,
    filterValue: (user) => user.email ?? "",
    render: (user) => <span className="text-muted-foreground">{user.email}</span>,
  },
  {
    key: "role",
    header: "Role",
    searchable: true,
    filterValue: (user) => user.role ?? "",
    render: (user) => (
      <Badge variant="outline" className={roleColors[user.role] || ""}>
        {user.role}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    searchable: true,
    filterValue: (user) => user.status ?? "",
    render: (user) => (
      <Badge
        variant="outline"
        className={
          user.status === "active"
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : "bg-red-500/10 text-red-500 border-red-500/20"
        }
      >
        {user.status}
      </Badge>
    ),
  },
  {
    key: "created",
    header: "Created",
    render: (user) => (
      <span className="text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "agent", password: "" });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery, roleFilter],
    queryFn: () =>
      api.users.list({
        search: searchQuery || undefined,
        role: roleFilter || undefined,
      }),
  });

  const { data: teamsData } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: () => api.teams.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.users.create(newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateOpen(false);
      setNewUser({ name: "", email: "", role: "agent", password: "" });
      toast.success("User created successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to create user", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to delete user", { description: err.message });
    },
  });

  const users: User[] = usersData?.data ?? (Array.isArray(usersData) ? usersData as User[] : []);
  const teams = teamsData ?? [];

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-muted-foreground">Users, teams, RBAC, and system management</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              className="space-y-4"
            >
              <div>
                <Label>Name</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.status === "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable<User>
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search users..."
        onDelete={(id) => deleteMutation.mutate(id)}
        deleteLabel="this user"
        emptyMessage="No users found."
        filters={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
            <option value="viewer">Viewer</option>
          </select>
        }
      />

      {/* Teams */}
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team: any) => (
                <Card key={team.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.member_count ?? 0} members
                        </p>
                      </div>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
