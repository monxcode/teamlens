"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Shield, Plus, Users, Trash2, Edit } from "lucide-react";

interface Permission { id: string; name: string; module: string; action: string; }
interface Role {
  id: string; name: string; description: string | null; isSystem: boolean; isDefault: boolean;
  permissions: { permission: Permission }[];
  _count: { users: number };
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchRoles(); fetchPermissions(); }, []);

  async function fetchRoles() {
    const res = await fetch("/api/admin/roles", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setRoles(data.roles || []);
    setLoading(false);
  }

  async function fetchPermissions() {
    const res = await fetch("/api/admin/permissions", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setPermissions(data.permissions || []);
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify(newRole),
    });
    if (res.ok) { setShowCreateModal(false); setNewRole({ name: "", description: "" }); fetchRoles(); }
    setCreating(false);
  }

  async function deleteRole(id: string) {
    if (!confirm("Delete this role?")) return;
    await fetch(`/api/admin/roles/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    fetchRoles();
  }

  async function savePermissions() {
    if (!selectedRole) return;
    await fetch(`/api/admin/roles/${selectedRole.id}/permissions`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ permissionIds: selectedPerms }),
    });
    setShowPermModal(false);
    fetchRoles();
  }

  function openPermModal(role: Role) {
    setSelectedRole(role);
    setSelectedPerms(role.permissions.map((p) => p.permission.id));
    setShowPermModal(true);
  }

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin", admin: "Admin", manager: "Manager",
    team_lead: "Team Lead", member: "Member", viewer: "Viewer",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{roles.length} roles, {permissions.length} permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> New Role</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} hover className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{roleLabels[role.name] || role.name}</h3>
                    {role.isSystem && <Badge variant="secondary">System</Badge>}
                    {role.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{role.description || "No description"}</p>
                </div>
                {!role.isSystem && (
                  <button onClick={() => deleteRole(role.id)} className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {role._count.users} users
                </div>
                <Badge>{role.permissions.length} permissions</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => openPermModal(role)}>
                <Edit className="h-3.5 w-3.5" /> Manage Permissions
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Role">
        <form onSubmit={createRole} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="e.g. editor" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input placeholder="What can this role do?" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Permissions Modal */}
      <Modal open={showPermModal} onClose={() => setShowPermModal(false)} title={`Permissions — ${selectedRole ? (roleLabels[selectedRole.name] || selectedRole.name) : ""}`}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {(() => {
            const grouped = permissions.reduce((acc, p) => {
              if (!acc[p.module]) acc[p.module] = [];
              acc[p.module].push(p);
              return acc;
            }, {} as Record<string, Permission[]>);
            return Object.entries(grouped).map(([module, perms]) => (
              <div key={module}>
                <h4 className="text-sm font-semibold capitalize mb-2">{module}</h4>
                <div className="space-y-1">
                  {perms.map((p) => (
                    <Checkbox
                      key={p.id}
                      checked={selectedPerms.includes(p.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedPerms([...selectedPerms, p.id]);
                        else setSelectedPerms(selectedPerms.filter((id) => id !== p.id));
                      }}
                      label={p.name}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setShowPermModal(false)} className="flex-1">Cancel</Button>
          <Button onClick={savePermissions} className="flex-1">Save Permissions</Button>
        </div>
      </Modal>
    </div>
  );
}
