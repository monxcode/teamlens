"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { EmptyState } from "@/components/ui/empty-state";
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatRelativeTime } from "@/lib/utils";
import {
  Users, FolderKanban, CheckSquare, Crown, Target, Clock, ArrowRight,
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
  members: TeamMember[];
  myRole: string;
  _count: { members: number };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string };
}

interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
  tasks: { id: string; status: string; assigneeId: string | null }[];
}

export default function TeamPage() {
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<{
    totalTeams: number;
    totalMembers: number;
    myTasks: number;
    myCompletedTasks: number;
    myProjects: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchTeamData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function fetchTeamData() {
    try {
      const token = localStorage.getItem("pulse_token");
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyTeam(data.myTeam || null);
      setMyTasks(data.myTasks || []);
      setMyProjects(data.myProjects || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    } finally {
      setLoading(false);
    }
  }

  const roleColors: Record<string, string> = {
    lead: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    member: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your team and assignments
          </p>
        </div>
        <Card className="p-12">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No team assigned"
            description="You haven't been assigned to a team yet. Contact your administrator to be added to a team."
          />
        </Card>
      </div>
    );
  }

  const completedTasks = myTasks.filter((t) => t.status === "done").length;
  const pendingTasks = myTasks.filter((t) => t.status !== "done").length;
  const overdueTasks = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
  ).length;
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0;

  const teamLead = myTeam.members.find((m) => m.role === "lead");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your team overview and assignments
        </p>
      </div>

      {/* Team Info Card */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{myTeam.name}</h2>
                <Badge variant="success">{myTeam.status}</Badge>
                {myTeam.myRole === "lead" && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Crown className="h-3 w-3 mr-1" /> Team Lead
                  </Badge>
                )}
              </div>
              {myTeam.description && (
                <p className="mt-2 text-sm text-muted-foreground">{myTeam.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="mt-1 text-3xl font-bold">{myTeam._count.members}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">My Tasks</p>
              <p className="mt-1 text-3xl font-bold">{myTasks.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <CheckSquare className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="mt-1 text-3xl font-bold">{completionRate}%</p>
            </div>
            <ProgressRing value={completionRate} size={48} strokeWidth={4} />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue Tasks</p>
              <p className="mt-1 text-3xl font-bold text-destructive">{overdueTasks}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <Clock className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Members */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTeam.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-2">
                  <Avatar name={member.user.name} src={member.user.avatarUrl} size="sm" role={member.user.role} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  </div>
                  <Badge className={roleColors[member.role] || roleColors.member}>
                    {member.role === "lead" && <Crown className="h-3 w-3 mr-1" />}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                </div>
              ))}
              {myTeam.members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No team members</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4" /> My Tasks
              </CardTitle>
              <Link href="/dashboard/tasks" className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks assigned</p>
            ) : (
              <div className="space-y-2">
                {myTasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: task.project.color }}
                        />
                        <span className="text-xs text-muted-foreground">{task.project.name}</span>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due {formatRelativeTime(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
                    <Badge className={getPriorityColor(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4" /> My Projects
            </CardTitle>
            <Link href="/dashboard/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {myProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No projects assigned</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myProjects.map((project) => {
                const totalTasks = project.tasks.length;
                const completedTasks = project.tasks.filter((t) => t.status === "done").length;
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <Card hover className="p-4 h-full">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-lg shrink-0" style={{ backgroundColor: project.color }} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {completedTasks}/{totalTasks} tasks
                          </p>
                        </div>
                        <ProgressRing value={progress} size={32} strokeWidth={3} />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
