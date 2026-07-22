"use client";

import { useState, useCallback } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime, getStatusLabel } from "@/lib/utils";
import { usePolling } from "@/hooks/use-polling";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  Users,
  TrendingUp,
  Activity,
  Plus,
} from "lucide-react";

interface DashboardData {
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    teamSize: number;
  };
  recentActivity: {
    id: string;
    type: string;
    details: string;
    createdAt: string;
    user: { name: string };
  }[];
  tasksByStatus: { status: string; count: number }[];
}

export default function DashboardPage() {
  const fetcher = useCallback(async (): Promise<DashboardData> => {
    const token = sessionStorage.getItem("pulse_token");
    const headers = { Authorization: `Bearer ${token}` };

    const [projectsRes, tasksRes, teamRes, activitiesRes] = await Promise.all([
      fetch("/api/projects", { headers }),
      fetch("/api/tasks", { headers }),
      fetch("/api/teams", { headers }),
      fetch("/api/activities", { headers }),
    ]);

    const [projects, tasks, team, activities] = await Promise.all([
      projectsRes.json(),
      tasksRes.json(),
      teamRes.json(),
      activitiesRes.json(),
    ]);

    const tasksByStatus = ["todo", "in_progress", "in_review", "done"].map(
      (status) => ({
        status,
        count: tasks.tasks?.filter((t: { status: string }) => t.status === status).length || 0,
      })
    );

    return {
      stats: {
        totalProjects: projects.projects?.length || 0,
        totalTasks: tasks.tasks?.length || 0,
        completedTasks:
          tasks.tasks?.filter((t: { status: string }) => t.status === "done").length || 0,
        teamSize: team.stats?.totalMembers || team.members?.length || 0,
      },
      recentActivity: activities.activities?.slice(0, 8) || [],
      tasksByStatus,
    };
  }, []);

  const { data, loading } = usePolling<DashboardData>(fetcher, {
    interval: 30000,
    enabled: true,
  });

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const completionRate =
    data.stats.totalTasks > 0
      ? Math.round((data.stats.completedTasks / data.stats.totalTasks) * 100)
      : 0;

  const statusColors: Record<string, string> = {
    todo: "#71717a",
    in_progress: "#3b82f6",
    in_review: "#f59e0b",
    done: "#10b981",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={data.stats.totalProjects}
          icon={FolderKanban}
          gradient="from-indigo-500/10 to-indigo-500/5"
        />
        <StatCard
          title="Total Tasks"
          value={data.stats.totalTasks}
          icon={CheckSquare}
          gradient="from-blue-500/10 to-blue-500/5"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          gradient="from-emerald-500/10 to-emerald-500/5"
        />
        <StatCard
          title="Team Members"
          value={data.stats.teamSize}
          icon={Users}
          gradient="from-purple-500/10 to-purple-500/5"
        />
      </div>

      {data.stats.totalProjects === 0 && data.stats.totalTasks === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<FolderKanban className="h-8 w-8" />}
            title="Welcome to Pulse"
            description="Get started by creating your first project and adding tasks to track your team's work."
            action={
              <Link href="/dashboard/projects" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Create Your First Project
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Task Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.tasksByStatus.map((item) => {
                    const total = data.stats.totalTasks;
                    const percentage = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.status}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: statusColors[item.status] }}
                            />
                            <span className="text-sm font-medium">
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.count} tasks
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: statusColors[item.status],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 flex items-center justify-center">
                  <ProgressRing value={completionRate} size={120} strokeWidth={8} />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{activity.user.name}</span>{" "}
                          <span className="text-muted-foreground">
                            {activity.details}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {data.recentActivity.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No activity yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Activity will appear as your team works on tasks
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
