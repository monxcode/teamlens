"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { Megaphone, Plus, Users, Eye, Clock, CheckCircle2, Trash2 } from "lucide-react";

interface Announcement {
  id: string; title: string; message: string; type: string; active: boolean;
  targetType: string; targetIds: string[]; expiresAt: string | null;
  createdAt: string; author: { id: string; name: string };
  readCount: number; totalTargeted: number | string;
  reads: { userId: string; readAt: string }[];
}

interface Team { id: string; name: string; }
interface User { id: string; name: string; email: string; role: string; }

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showStats, setShowStats] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "", message: "", type: "info", targetType: "everyone",
    targetIds: [] as string[], expiresAt: "",
  });
  const [creating, setCreating] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [targetSearch, setTargetSearch] = useState("");

  useEffect(() => { fetchAnnouncements(); fetchTargets(); }, []);

  async function fetchAnnouncements() {
    const res = await fetch("/api/admin/announcements", { headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }

  async function fetchTargets() {
    const token = sessionStorage.getItem("pulse_token");
    const [teamsRes, usersRes] = await Promise.all([
      fetch("/api/admin/teams", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/admin/users?limit=100", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const teamsData = await teamsRes.json();
    const usersData = await usersRes.json();
    setTeams(teamsData.teams || []);
    setUsers(usersData.users || []);
  }

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newAnnouncement,
        expiresAt: newAnnouncement.expiresAt || null,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewAnnouncement({ title: "", message: "", type: "info", targetType: "everyone", targetIds: [], expiresAt: "" });
      fetchAnnouncements();
    }
    setCreating(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    fetchAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    await fetch(`/api/admin/announcements/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` },
    });
    setShowDeleteConfirm(null);
    fetchAnnouncements();
  }

  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const targetTypeLabels: Record<string, string> = {
    everyone: "Everyone",
    teams: "Specific Teams",
    roles: "Specific Roles",
    users: "Individual Users",
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(targetSearch.toLowerCase())
  );

  const selectedAnnouncement = announcements.find((a) => a.id === showStats);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">{announcements.length} announcements</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Announcement</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : announcements.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-8 w-8" />} title="No announcements" description="Create announcements to broadcast messages to users." />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{a.title}</h3>
                      <Badge className={typeColors[a.type] || typeColors.info}>{a.type}</Badge>
                      <Badge variant="outline">{targetTypeLabels[a.targetType]}</Badge>
                      {!a.active && <Badge variant="secondary">Inactive</Badge>}
                      {a.expiresAt && new Date(a.expiresAt) < new Date() && <Badge variant="secondary">Expired</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.message}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>By {a.author.name}</span>
                      <span>{formatRelativeTime(a.createdAt)}</span>
                      {a.expiresAt && <span>Expires {formatRelativeTime(a.expiresAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => setShowStats(a.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {a.totalTargeted === "all" ? a.readCount : `${a.readCount}/${a.totalTargeted}`}
                    </button>
                    <button
                      onClick={() => toggleActive(a.id, a.active)}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${a.active ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}
                    >
                      {a.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(a.id)}
                      className="text-xs px-2 py-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Announcement">
        <form onSubmit={createAnnouncement} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="Announcement title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea placeholder="Announcement message..." value={newAnnouncement.message} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={newAnnouncement.type} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                options={[{ value: "info", label: "Info" }, { value: "warning", label: "Warning" }, { value: "critical", label: "Critical" }]} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expires</label>
              <Input type="datetime-local" value={newAnnouncement.expiresAt} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Audience</label>
            <Select value={newAnnouncement.targetType} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetType: e.target.value, targetIds: [] })}
              options={[{ value: "everyone", label: "Everyone" }, { value: "teams", label: "Specific Teams" }, { value: "roles", label: "Specific Roles" }, { value: "users", label: "Individual Users" }]} />
          </div>

          {newAnnouncement.targetType === "teams" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Teams</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {teams.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                    <input type="checkbox" checked={newAnnouncement.targetIds.includes(t.id)}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        targetIds: e.target.checked ? [...newAnnouncement.targetIds, t.id] : newAnnouncement.targetIds.filter((id) => id !== t.id),
                      })} className="rounded" />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {newAnnouncement.targetType === "roles" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Roles</label>
              <div className="flex flex-wrap gap-2">
                {["super_admin", "admin", "member"].map((role) => (
                  <label key={role} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-muted">
                    <input type="checkbox" checked={newAnnouncement.targetIds.includes(role)}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        targetIds: e.target.checked ? [...newAnnouncement.targetIds, role] : newAnnouncement.targetIds.filter((id) => id !== role),
                      })} className="rounded" />
                    <span className="text-sm capitalize">{role.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {newAnnouncement.targetType === "users" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Users</label>
              <Input placeholder="Search users..." value={targetSearch} onChange={(e) => setTargetSearch(e.target.value)} />
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {filteredUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                    <input type="checkbox" checked={newAnnouncement.targetIds.includes(u.id)}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        targetIds: e.target.checked ? [...newAnnouncement.targetIds, u.id] : newAnnouncement.targetIds.filter((id) => id !== u.id),
                      })} className="rounded" />
                    <div>
                      <span className="text-sm">{u.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Publish"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal open={!!showStats} onClose={() => setShowStats(null)} title="Delivery Status">
        {selectedAnnouncement && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{selectedAnnouncement.totalTargeted === "all" ? "All" : selectedAnnouncement.totalTargeted}</p>
                <p className="text-xs text-muted-foreground">Targeted</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-emerald-600">{selectedAnnouncement.readCount}</p>
                <p className="text-xs text-muted-foreground">Read</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-amber-600">
                  {selectedAnnouncement.totalTargeted === "all" ? "—" : Math.max(0, (selectedAnnouncement.totalTargeted as number) - selectedAnnouncement.readCount)}
                </p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Read by</p>
              {selectedAnnouncement.reads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reads yet</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {selectedAnnouncement.reads.map((r) => (
                    <div key={r.userId} className="flex items-center gap-2 text-sm py-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>{users.find((u) => u.id === r.userId)?.name || r.userId}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(r.readAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Announcement">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this announcement? This action cannot be undone and the announcement will be removed from all users immediately.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={() => showDeleteConfirm && deleteAnnouncement(showDeleteConfirm)} className="flex-1">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
