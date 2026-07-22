"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import {
  Users, Plus, Search, MoreHorizontal, Archive, Trash2,
  RotateCcw, Edit, UserPlus, Crown, X, Eye,
} from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  members: TeamMember[];
  workspace: { id: string; name: string };
  _count: { members: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [editTeam, setEditTeam] = useState({ name: "", description: "" });
  const [addingUserId, setAddingUserId] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  useEffect(() => { fetchTeams(); fetchUsers(); }, []);

  async function fetchTeams() {
    setLoading(true);
    const res = await fetch("/api/admin/teams", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setTeams(data.teams || []);
    setLoading(false);
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users?limit=100", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify(newTeam),
    });
    if (res.ok) {
      setShowCreateModal(false);
      setNewTeam({ name: "", description: "" });
      fetchTeams();
    }
    setCreating(false);
  }

  async function updateTeam() {
    if (!selectedTeam) return;
    await fetch(`/api/admin/teams/${selectedTeam.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify(editTeam),
    });
    setShowEditModal(false);
    fetchTeams();
  }

  async function archiveTeam(id: string, status: string) {
    await fetch(`/api/admin/teams/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "active" ? "archived" : "active" }),
    });
    setActionMenu(null);
    fetchTeams();
  }

  async function deleteTeam(id: string) {
    if (!confirm("Delete this team? Members will be removed.")) return;
    await fetch(`/api/admin/teams/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    setActionMenu(null);
    fetchTeams();
  }

  async function addMember() {
    if (!selectedTeam || !addingUserId) return;
    await fetch(`/api/admin/teams/${selectedTeam.id}/members`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addingUserId }),
    });
    setShowAddMemberModal(false);
    setAddingUserId("");
    fetchTeams();
  }

  async function removeMember(teamId: string, userId: string) {
    if (!confirm("Remove this member from the team?")) return;
    await fetch(`/api/admin/teams/${teamId}/members?teamId=${teamId}&userId=${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    fetchTeams();
  }

  async function setTeamLead(teamId: string, userId: string, currentRole: string) {
    const newRole = currentRole === "lead" ? "member" : "lead";
    await fetch(`/api/admin/teams/${teamId}/members`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, teamId, role: newRole }),
    });
    fetchTeams();
  }

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">{teams.length} teams</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> New Team</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search teams..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No teams found" description="Create a team to organize your members." action={<Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> Create Team</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <Card key={team.id} hover className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/teams/${team.id}`} className="font-semibold hover:underline">{team.name}</Link>
                    <Badge variant={team.status === "active" ? "success" : "secondary"}>{team.status}</Badge>
                  </div>
                  {team.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{team.description}</p>}
                </div>
                <div className="relative">
                  <button onClick={() => setActionMenu(actionMenu === team.id ? null : team.id)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {actionMenu === team.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border bg-card shadow-xl z-50 py-1">
                      <Link href={`/admin/teams/${team.id}`} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                        <Eye className="h-4 w-4" /> View Details
                      </Link>
                      <button onClick={() => { setSelectedTeam(team); setEditTeam({ name: team.name, description: team.description || "" }); setShowEditModal(true); setActionMenu(null); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left">
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => { setSelectedTeam(team); setShowAddMemberModal(true); setActionMenu(null); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left">
                        <UserPlus className="h-4 w-4" /> Add Member
                      </button>
                      <button onClick={() => archiveTeam(team.id, team.status)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left">
                        {team.status === "active" ? <><Archive className="h-4 w-4" /> Archive</> : <><RotateCcw className="h-4 w-4" /> Restore</>}
                      </button>
                      <button onClick={() => deleteTeam(team.id)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Workspace: {team.workspace.name}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{team._count.members} members</span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(team.createdAt)}</span>
              </div>
              {team.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.members.slice(0, 5).map((m) => (
                    <div key={m.id} className="relative group">
                      <Avatar name={m.user.name} src={m.user.avatarUrl} size="sm" className="ring-2 ring-background" role={m.user.role} />
                      {m.role === "lead" && <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-500" />}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-card border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {m.user.name} ({m.role})
                      </div>
                    </div>
                  ))}
                  {team.members.length > 5 && (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Team">
        <form onSubmit={createTeam} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Team Name</label>
            <Input placeholder="e.g. Engineering" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="What does this team do?" value={newTeam.description} onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Create Team"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Team">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Team Name</label>
            <Input value={editTeam.name} onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={editTeam.description} onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={updateTeam} className="flex-1">Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title={`Add Member to ${selectedTeam?.name || ""}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <select
              value={addingUserId}
              onChange={(e) => setAddingUserId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={addMember} disabled={!addingUserId} className="flex-1">Add Member</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
