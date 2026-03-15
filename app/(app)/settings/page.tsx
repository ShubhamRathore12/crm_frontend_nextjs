"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Connection = {
  id: string;
  provider: string;
  name: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Shield, User, Mail, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

import { DynamicFieldsSettings } from "@/components/settings/dynamic-fields-settings";
import { GroupManagement } from "@/components/settings/group-management";

export default function SettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "agent", password: "" });
  const [adding, setAdding] = useState<"zapier" | "slack" | "calendly" | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [calendlyLink, setCalendlyLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.integrations.connections.list().catch(() => []),
      api.users.list().then(res => (res as any).data ?? res).catch(() => [])
    ]).then(([connectionsList, usersList]) => {
      setConnections(connectionsList);
      setUsers(usersList as any[]);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateUser = async () => {
    try {
      setError(null);
      const user = await api.users.create(newUser);
      setUsers([user, ...users]);
      setAddingUser(false);
      setNewUser({ name: "", email: "", role: "agent", password: "" });
      setSuccess(`User ${user.name} created successfully.`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await api.users.delete(id);
      setUsers(users.map(u => u.id === id ? { ...u, status: 'deleted' } : u));
      setSuccess("User deactivated.");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const addConnection = async () => {
    setError(null);
    setSuccess(null);
    if (adding === "zapier" && webhookUrl.trim()) {
      try {
        await api.integrations.connections.create({
          provider: "zapier",
          name: "Zapier Webhook",
          config: { webhook_url: webhookUrl.trim() },
        });
        setSuccess("Zapier webhook added. Events (e.g. lead created) will be sent here.");
        setWebhookUrl("");
        setAdding(null);
        const list = await api.integrations.connections.list();
        setConnections(list);
      } catch (e) {
        setError((e as Error).message);
      }
    } else if (adding === "slack" && webhookUrl.trim()) {
      try {
        await api.integrations.connections.create({
          provider: "slack",
          name: "Slack Incoming Webhook",
          config: { webhook_url: webhookUrl.trim() },
        });
        setSuccess("Slack webhook added. Use Integrations or workflows to post messages.");
        setWebhookUrl("");
        setAdding(null);
        const list = await api.integrations.connections.list();
        setConnections(list);
      } catch (e) {
        setError((e as Error).message);
      }
    } else if (adding === "calendly" && calendlyLink.trim()) {
      try {
        await api.integrations.connections.create({
          provider: "calendly",
          name: "Calendly",
          config: { scheduling_link: calendlyLink.trim() },
        });
        setSuccess("Calendly link saved. Use 'Arrange meeting' to send it to contacts.");
        setCalendlyLink("");
        setAdding(null);
        const list = await api.integrations.connections.list();
        setConnections(list);
      } catch (e) {
        setError((e as Error).message);
      }
    } else {
      setError("Enter a valid URL.");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your team, customize fields, and configure system behavior.</p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="integrations" className="text-xs md:text-sm">Integrations</TabsTrigger>
          <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
          <TabsTrigger value="fields" className="text-xs md:text-sm">Fields</TabsTrigger>
          <TabsTrigger value="groups" className="text-xs md:text-sm">Groups</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs md:text-sm">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect Zapier, Slack, and Calendly.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                  {success}
                </p>
              )}

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Zapier */}
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-medium">Zapier</h4>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Outbound webhooks for lead and interaction events.
                  </p>
                  {adding === "zapier" ? (
                    <div className="space-y-2">
                      <Input
                        type="url"
                        placeholder="Webhook URL"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addConnection}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setAdding(null); setWebhookUrl(""); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAdding("zapier")}>Add webhook</Button>
                  )}
                </div>

                {/* Slack */}
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-medium">Slack</h4>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Post notifications to channels via Webhooks.
                  </p>
                  {adding === "slack" ? (
                    <div className="space-y-2">
                      <Input
                        type="url"
                        placeholder="Incoming Webhook URL"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addConnection}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setAdding(null); setWebhookUrl(""); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAdding("slack")}>Add webhook</Button>
                  )}
                </div>

                {/* Calendly */}
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-medium">Calendly</h4>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Your scheduling link for arranging meetings.
                  </p>
                  {adding === "calendly" ? (
                    <div className="space-y-2">
                      <Input
                        type="url"
                        placeholder="Calendly Link"
                        value={calendlyLink}
                        onChange={(e) => setCalendlyLink(e.target.value)}
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addConnection}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setAdding(null); setCalendlyLink(""); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAdding("calendly")}>Add link</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Users</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Manage team members and their access levels.</p>
              </div>
              <Dialog open={addingUser} onOpenChange={setAddingUser}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={newUser.name} 
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={newUser.email} 
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                        placeholder="john@company.com" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Enter password"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(val) => setNewUser({...newUser, role: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddingUser(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Joined</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {user.name[0]}
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize text-[10px] font-mono">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              user.status === 'active' ? "bg-green-500" : "bg-red-500"
                            )} />
                            <span className="capitalize text-xs">{user.status}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs font-mono">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.status === 'deleted'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {users.map(user => (
                  <div key={user.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                          {user.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.status === 'deleted'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Badge variant="outline" className="capitalize text-[10px] font-mono">
                        {user.role}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          user.status === 'active' ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="capitalize">{user.status}</span>
                      </div>
                      <span className="text-muted-foreground font-mono ml-auto">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground italic">No users found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <DynamicFieldsSettings />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <GroupManagement />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <p className="text-sm text-muted-foreground">Cleanup and archiving tasks.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm md:text-base">6-Month Archiving</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">Move resolved interactions older than 6 months to dedicated archive tables.</p>
                </div>
                <Button 
                  variant="outline" 
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await api.maintenance.runArchive();
                      setSuccess(`Archiving completed: ${JSON.stringify((res as any).summary)}`);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "Archiving..." : "Archive Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

