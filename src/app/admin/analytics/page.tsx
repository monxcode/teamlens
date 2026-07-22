"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { Users, FolderKanban, CheckSquare, TrendingUp, BarChart3 } from "lucide-react";

interface AnalyticsData {
  overview: { totalUsers: number; activeUsers: number; totalProjects: number; totalTasks: number; completionRate: number; totalActivities: number };
  tasks: { byStatus: { status: string; _count: number }[]; byPriority: { priority: string; _count: number }[] };
  users: { byRole: { role: string; _count: number }[]; newThisWeek: number; newThisMonth: number };
  tasksThisWeek: { created: number; completed: number };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;
  if (!data) return null;

  const { overview, tasks, users, tasksThisWeek } = data;

  const statusLabels: Record<string, string> = { todo: "To Do", in_progress: "In Progress", in_review: "In Review", done: "Done" };
  const priorityLabels: Record<string, string> = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
  const roleLabels: Record<string, string> = { super_admin: "Super Admin", admin: "Admin", manager: "Manager", team_lead: "Team Lead", member: "Member", viewer: "Viewer" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">System-wide analytics and insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={overview.totalUsers} icon={Users} gradient="from-blue-500/10 to-blue-500/5" />
        <StatCard title="Total Projects" value={overview.totalProjects} icon={FolderKanban} gradient="from-indigo-500/10 to-indigo-500/5" />
        <StatCard title="Total Tasks" value={overview.totalTasks} icon={CheckSquare} gradient="from-emerald-500/10 to-emerald-500/5" />
        <StatCard title="Activities" value={overview.totalActivities} icon={BarChart3} gradient="from-purple-500/10 to-purple-500/5" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Tasks by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.byStatus.map((item) => {
                const total = overview.totalTasks;
                const pct = total > 0 ? (item._count / total) * 100 : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{statusLabels[item.status] || item.status}</span>
                      <span className="text-sm text-muted-foreground">{item._count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-center">
              <ProgressRing value={overview.completionRate} size={100} strokeWidth={6} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tasks by Priority</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.byPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <span className="text-sm">{priorityLabels[item.priority] || item.priority}</span>
                  <Badge variant="secondary">{item._count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Users by Role</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.byRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span className="text-sm">{roleLabels[item.role] || item.role}</span>
                  <Badge variant="secondary">{item._count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">This Week</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-primary">{users.newThisWeek}</p>
                <p className="text-sm text-muted-foreground mt-1">New Users</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-emerald-500">{tasksThisWeek.completed}</p>
                <p className="text-sm text-muted-foreground mt-1">Tasks Completed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-blue-500">{tasksThisWeek.created}</p>
                <p className="text-sm text-muted-foreground mt-1">Tasks Created</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{overview.completionRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
