"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { ProjectColor } from "@/components/dashboard/project-color";
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft, Users, FolderKanban, CheckSquare, Crown, Activity,
  Plus, UserPlus, Trash2, Calendar, Clock, TrendingUp, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface MemberStats {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null; lastLoginAt: string | null };
  stats: { totalTasks: number; completedTasks: number; pendingTasks: number; overdueTasks: number; efficiency: number };
  lastActivity: { time: string; details: string } | null;
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  members: MemberStats[];
  workspace: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
  tasks: { id: string; status: string }[];
  members: string[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  project: { id: string; name: string; color: string };
}

interface Activity {
  id: string;
  type: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
  task: { id: string; title: string } | null;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  createdAt: string;
  admin: { id: string; name: string; avatarUrl: string | null };
}

interface TeamStats {
  totalMembers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "projects" | "tasks" | "activity">("overview");
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingUserId, setAddingUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    fetchTeamData();
    fetchUsers();
  }, [params.id]);

  async function fetchTeamData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teams/${params.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
      });
      if (!res.ok) { router.push("/admin/teams"); return; }
      const data = await res.json();
      setTeam(data.team);
      setProjects(data.projects || []);
      setTasks(data.tasks || []);
      setActivities(data.activities || []);
      setAuditLogs(data.auditLogs || []);
      setStats(data.stats);
    } catch { router.push("/admin/teams"); }
    setLoading(false);
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users?limit=100", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function addMember() {
    if (!addingUserId) return;
    await fetch(`/api/admin/teams/${params.id}/members`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addingUserId }),
    });
    setShowAddMember(false);
    setAddingUserId("");
    setUserSearch("");
    fetchTeamData();
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member from the team?")) return;
    await fetch(`/api/admin/teams/${params.id}/members?teamId=${params.id}&userId=${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    fetchTeamData();
  }

  async function setTeamLead(userId: string, currentRole: string) {
    const newRole = currentRole === "lead" ? "member" : "lead";
    await fetch(`/api/admin/teams/${params.id}/members`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, teamId: params.id, role: newRole }),
    });
    fetchTeamData();
  }

  const filteredUsers = userSearch
    ? users.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).slice(0, 8)
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!team || !stats) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "members" as const, label: "Members", icon: Users },
    { id: "projects" as const, label: "Projects", icon: FolderKanban },
    { id: "tasks" as const, label: "Tasks", icon: CheckSquare },
    { id: "activity" as const, label: "Activity", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/teams" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
            <Badge variant={team.status === "active" ? "success" : "secondary"}>{team.status}</Badge>
          </div>
          {team.description && <p className="mt-1 text-sm text-muted-foreground">{team.description}</p>}
        </div>
        <Button onClick={() => setShowAddMember(true)}><UserPlus className="h-4 w-4" /> Add Member</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Members</p><p className="mt-1 text-2xl font-bold">{stats.totalMembers}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Projects</p><p className="mt-1 text-2xl font-bold">{stats.totalProjects}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10"><FolderKanban className="h-5 w-5 text-indigo-500" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Completion Rate</p><p className="mt-1 text-2xl font-bold">{stats.completionRate}%</p></div>
            <ProgressRing value={stats.completionRate} size={40} strokeWidth={3} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Overdue Tasks</p><p className="mt-1 text-2xl font-bold text-destructive">{stats.overdueTasks}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Task Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Task Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["todo", "in_progress", "in_review", "done"].map((status) => {
                  const count = tasks.filter((t) => t.status === status).length;
                  const pct = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
                  const colors: Record<string, string> = { todo: "#71717a", in_progress: "#3b82f6", in_review: "#f59e0b", done: "#10b981" };
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{getStatusLabel(status)}</span>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[status] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <Avatar name={a.user.name} src={a.user.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm"><span className="font-medium">{a.user.name}</span> <span className="text-muted-foreground">{a.details}</span></p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "members" && (
        <div className="space-y-3">
          {team.members.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar name={m.user.name} src={m.user.avatarUrl} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{m.user.name}</h3>
                    {m.role === "lead" && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Crown className="h-3 w-3 mr-1" /> Lead</Badge>}
                    <Badge variant="secondary">{m.user.lastLoginAt ? `Active ${formatRelativeTime(m.user.lastLoginAt)}` : "Never logged in"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{m.user.email}</p>
                </div>
                <div className="grid grid-cols-4 gap-6 text-center shrink-0">
                  <div><p className="text-lg font-bold">{m.stats.totalTasks}</p><p className="text-xs text-muted-foreground">Total</p></div>
                  <div><p className="text-lg font-bold text-emerald-500">{m.stats.completedTasks}</p><p className="text-xs text-muted-foreground">Done</p></div>
                  <div><p className="text-lg font-bold text-blue-500">{m.stats.pendingTasks}</p><p className="text-xs text-muted-foreground">Pending</p></div>
                  <div><p className="text-lg font-bold text-primary">{m.stats.efficiency}%</p><p className="text-xs text-muted-foreground">Rate</p></div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setTeamLead(m.user.id, m.role)}>
                    {m.role === "lead" ? "Remove Lead" : "Make Lead"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => removeMember(m.user.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {m.lastActivity && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Last: {m.lastActivity.details} ({formatRelativeTime(m.lastActivity.time)})
                </div>
              )}
            </Card>
          ))}
          {team.members.length === 0 && <Card className="p-8"><p className="text-sm text-muted-foreground text-center">No team members</p></Card>}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const total = p.tasks.length;
            const done = p.tasks.filter((t) => t.status === "done").length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Card key={p.id} hover className="p-4">
                <div className="flex items-center gap-3">
                  <ProjectColor color={p.color} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{done}/{total} tasks done</p>
                  </div>
                  <ProgressRing value={pct} size={36} strokeWidth={3} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.members.slice(0, 3).map((name) => (
                    <Badge key={name} variant="secondary" className="text-[10px]">{name}</Badge>
                  ))}
                </div>
              </Card>
            );
          })}
          {projects.length === 0 && <Card className="p-8 col-span-full"><p className="text-sm text-muted-foreground text-center">No projects assigned to team members</p></Card>}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-2">
          {tasks.slice(0, 20).map((t) => (
            <Card key={t.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium">{t.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <ProjectColor color={t.project.color} size="sm" />
                    <span className="text-xs text-muted-foreground">{t.project.name}</span>
                    {t.assignee && <span className="text-xs text-muted-foreground">by {t.assignee.name}</span>}
                    {t.dueDate && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  </div>
                </div>
                <Badge className={getStatusColor(t.status)}>{getStatusLabel(t.status)}</Badge>
                <Badge className={getPriorityColor(t.priority)}>{getPriorityLabel(t.priority)}</Badge>
              </div>
            </Card>
          ))}
          {tasks.length === 0 && <Card className="p-8"><p className="text-sm text-muted-foreground text-center">No tasks assigned to team members</p></Card>}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-3">
          {activities.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={a.user.name} src={a.user.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-medium">{a.user.name}</span> <span className="text-muted-foreground">{a.details}</span></p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                    {a.task && <span className="text-xs text-muted-foreground">Task: {a.task.title}</span>}
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {activities.length === 0 && <Card className="p-8"><p className="text-sm text-muted-foreground text-center">No activity recorded</p></Card>}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddMember(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-card border rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Add Member to {team.name}</h2>
            <div className="space-y-2">
              <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              {filteredUsers.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <button key={u.id} onClick={() => { setAddingUserId(u.id); setUserSearch(u.name); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left">
                      <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                      <div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowAddMember(false)} className="flex-1">Cancel</Button>
              <Button onClick={addMember} disabled={!addingUserId} className="flex-1">Add Member</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
