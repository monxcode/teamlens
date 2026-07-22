"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { formatRelativeTime } from "@/lib/utils";
import {
  Users, FolderKanban, CheckSquare, BarChart3, Shield, Activity,
  AlertTriangle, TrendingUp, Building2,
} from "lucide-react";

interface AdminDashboardData {
  overview: {
    totalUsers: number; activeUsers: number; suspendedUsers: number;
    totalProjects: number; activeProjects: number; archivedProjects: number;
    totalTasks: number; totalWorkspaces: number; totalActivities: number;
    completionRate: number;
  };
  tasks: { byStatus: { status: string; _count: number }[]; byPriority: { priority: string; _count: number }[] };
  users: { byRole: { role: string; _count: number }[]; newThisWeek: number; newThisMonth: number };
  tasksThisWeek: { created: number; completed: number };
  security: { recentLogins: { id: string; email: string; success: boolean; ipAddress: string | null; createdAt: string }[]; failedLogins: number };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;
  if (!data) return null;

  const { overview, tasks, users, tasksThisWeek, security } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">System overview and key metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={overview.totalUsers} change={`${users.newThisWeek} new this week`} changeType="positive" icon={Users} gradient="from-blue-500/10 to-blue-500/5" />
        <StatCard title="Active Projects" value={overview.activeProjects} change={`${overview.archivedProjects} archived`} changeType="neutral" icon={FolderKanban} gradient="from-indigo-500/10 to-indigo-500/5" />
        <StatCard title="Total Tasks" value={overview.totalTasks} change={`${tasksThisWeek.completed} completed`} changeType="positive" icon={CheckSquare} gradient="from-emerald-500/10 to-emerald-500/5" />
        <StatCard title="Workspaces" value={overview.totalWorkspaces} change="Active" changeType="neutral" icon={Building2} gradient="from-purple-500/10 to-purple-500/5" />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="mt-1 text-3xl font-bold">{overview.completionRate}%</p>
            </div>
            <ProgressRing value={overview.completionRate} size={48} strokeWidth={4} />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="mt-1 text-3xl font-bold">{overview.activeUsers}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed Logins (7d)</p>
              <p className="mt-1 text-3xl font-bold text-destructive">{security.failedLogins}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suspended Users</p>
              <p className="mt-1 text-3xl font-bold">{overview.suspendedUsers}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <Shield className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Task Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.byStatus.map((item) => {
                const total = overview.totalTasks;
                const pct = total > 0 ? (item._count / total) * 100 : 0;
                const colors: Record<string, string> = { todo: "#71717a", in_progress: "#3b82f6", in_review: "#f59e0b", done: "#10b981" };
                const labels: Record<string, string> = { todo: "To Do", in_progress: "In Progress", in_review: "In Review", done: "Done" };
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[item.status] || "#71717a" }} />
                        <span className="text-sm font-medium">{labels[item.status] || item.status}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item._count} tasks</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: colors[item.status] || "#71717a" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader><CardTitle className="text-base">Users by Role</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.byRole.map((item) => {
                const roleLabels: Record<string, string> = { super_admin: "Super Admin", admin: "Admin", manager: "Manager", team_lead: "Team Lead", member: "Member", viewer: "Viewer" };
                return (
                  <div key={item.role} className="flex items-center justify-between">
                    <span className="text-sm">{roleLabels[item.role] || item.role}</span>
                    <Badge variant="secondary">{item._count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logins */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Login Attempts</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {security.recentLogins.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recent logins</p>}
            {security.recentLogins.map((login) => (
              <div key={login.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${login.success ? "bg-emerald-500" : "bg-destructive"}`} />
                  <div>
                    <p className="text-sm font-medium">{login.email}</p>
                    <p className="text-xs text-muted-foreground">{login.ipAddress || "Unknown IP"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={login.success ? "success" : "destructive"}>
                    {login.success ? "Success" : "Failed"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(login.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
