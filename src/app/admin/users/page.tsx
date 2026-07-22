"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import {
  Users, Plus, Search, MoreHorizontal, Shield, Ban, CheckCircle,
  Key, Trash2, Eye, UserPlus, FolderPlus, CheckSquare,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string; email: string; name: string; role: string; status: string;
  avatar: string | null; avatarUrl: string | null; lastLoginAt: string | null; loginAttempts: number;
  lockedUntil: string | null; createdAt: string;
  _count: { assignedTasks: number; projects: number };
}

interface Role { id: string; name: string; description: string | null; }
interface Team { id: string; name: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "member" });
  const [creating, setCreating] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); fetchRoles(); fetchTeams(); }, [page, filterStatus, filterRole]);

  async function fetchUsers() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterRole !== "all") params.set("role", filterRole);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setUsers(data.users || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function fetchRoles() {
    const res = await fetch("/api/admin/roles", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setRoles(data.roles || []);
  }

  async function fetchTeams() {
    const res = await fetch("/api/admin/teams", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setTeams((data.teams || []).map((t: Team) => ({ id: t.id, name: t.name })));
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) { setShowCreateModal(false); setNewUser({ name: "", email: "", password: "", role: "member" }); fetchUsers(); }
    setCreating(false);
  }

  async function suspendUser(userId: string, suspend: boolean) {
    await fetch(`/api/admin/users/${userId}/suspend`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ suspend }),
    });
    fetchUsers();
    setActionMenu(null);
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    fetchUsers();
    setActionMenu(null);
  }

  async function executeBulkAction() {
    if (!bulkAction || selectedUsers.length === 0) return;

    if (bulkAction === "delete") {
      if (!confirm(`Delete ${selectedUsers.length} users?`)) return;
      for (const userId of selectedUsers) {
        await fetch(`/api/admin/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
      }
    } else if (bulkAction === "suspend") {
      for (const userId of selectedUsers) {
        await fetch(`/api/admin/users/${userId}/suspend`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
          body: JSON.stringify({ suspend: true }),
        });
      }
    } else if (bulkAction === "activate") {
      for (const userId of selectedUsers) {
        await fetch(`/api/admin/users/${userId}/suspend`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
          body: JSON.stringify({ suspend: false }),
        });
      }
    } else if (bulkAction === "changeRole" && bulkValue) {
      for (const userId of selectedUsers) {
        await fetch(`/api/admin/users/${userId}/role`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
          body: JSON.stringify({ roleId: bulkValue }),
        });
      }
    } else if (bulkAction === "assignTeam" && bulkValue) {
      for (const userId of selectedUsers) {
        await fetch(`/api/admin/teams/${bulkValue}/members`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      }
    }

    setShowBulkModal(false);
    setSelectedUsers([]);
    setBulkAction("");
    setBulkValue("");
    fetchUsers();
  }

  function toggleSelectAll() {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  }

  function toggleSelect(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  const roleColors: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    manager: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    team_lead: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    member: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin", admin: "Admin", manager: "Manager",
    team_lead: "Team Lead", member: "Member", viewer: "Viewer",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} total users</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <Button variant="outline" onClick={() => setShowBulkModal(true)}>
              <CheckSquare className="h-4 w-4" /> Bulk Actions ({selectedUsers.length})
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> Add User</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()} className="pl-9" />
        </div>
        <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Statuses" }, { value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }]} />
        <Select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Roles" }, ...roles.map((r) => ({ value: r.name, label: roleLabels[r.name] || r.name }))]} />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No users found" description="Try adjusting your filters." />
      ) : (
        <div className="space-y-2">
          {/* Select All Header */}
          <Card className="p-3">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedUsers(users.map((u) => u.id));
                  else setSelectedUsers([]);
                }}
              />
              <span className="text-sm text-muted-foreground">
                {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : "Select all"}
              </span>
            </div>
          </Card>

          {users.map((user) => (
            <Card key={user.id} className={`p-4 hover:shadow-md transition-all ${selectedUsers.includes(user.id) ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleSelect(user.id)}
                />
                <Avatar name={user.name} src={user.avatarUrl} size="md" role={user.role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/users/${user.id}`} className="text-sm font-semibold hover:underline">{user.name}</Link>
                    <Badge className={roleColors[user.role] || roleColors.member}>{roleLabels[user.role] || user.role}</Badge>
                    {user.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{user._count.projects} projects</span>
                    <span>{user._count.assignedTasks} tasks</span>
                    <span>Last login: {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}</span>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {actionMenu === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border bg-card shadow-xl z-50 py-1">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                        <Eye className="h-4 w-4" /> View Details
                      </Link>
                      {user.status === "active" ? (
                        <button onClick={() => suspendUser(user.id, true)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-amber-600">
                          <Ban className="h-4 w-4" /> Suspend
                        </button>
                      ) : (
                        <button onClick={() => suspendUser(user.id, false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-emerald-600">
                          <CheckCircle className="h-4 w-4" /> Activate
                        </button>
                      )}
                      <button onClick={() => deleteUser(user.id)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Create User Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create User">
        <form onSubmit={createUser} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Full name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="user@company.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" placeholder="Minimum 6 characters" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              options={roles.map((r) => ({ value: r.name, label: roleLabels[r.name] || r.name }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal open={showBulkModal} onClose={() => setShowBulkModal(false)} title={`Bulk Actions (${selectedUsers.length} users)`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Select value={bulkAction} onChange={(e) => { setBulkAction(e.target.value); setBulkValue(""); }}
              options={[
                { value: "", label: "Select action..." },
                { value: "changeRole", label: "Change Role" },
                { value: "assignTeam", label: "Assign to Team" },
                { value: "suspend", label: "Suspend Users" },
                { value: "activate", label: "Activate Users" },
                { value: "delete", label: "Delete Users" },
              ]} />
          </div>

          {bulkAction === "changeRole" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
                options={roles.map((r) => ({ value: r.id, label: roleLabels[r.name] || r.name }))} />
            </div>
          )}

          {bulkAction === "assignTeam" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Team</label>
              <Select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
                options={teams.map((t) => ({ value: t.id, label: t.name }))} />
            </div>
          )}

          {bulkAction === "delete" && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              This action cannot be undone. All data associated with these users will be permanently deleted.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowBulkModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={executeBulkAction} disabled={!bulkAction || (bulkAction !== "suspend" && bulkAction !== "activate" && bulkAction !== "delete" && !bulkValue)}
              variant={bulkAction === "delete" ? "destructive" : "default"} className="flex-1">
              Execute
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
