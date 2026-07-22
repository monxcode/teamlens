"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, Shield, Activity, CheckSquare, FolderKanban } from "lucide-react";
import Link from "next/link";

interface UserDetails {
  id: string; email: string; name: string; role: string; status: string;
  avatar: string | null; avatarUrl: string | null; emailVerified: boolean; lastLoginAt: string | null;
  loginAttempts: number; lockedUntil: string | null; forcePasswordReset: boolean;
  createdAt: string; updatedAt: string;
  userRoles: { role: { id: string; name: string; description: string | null } }[];
  _count: { assignedTasks: number; projects: number; activities: number };
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` },
    })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => router.push("/admin/users"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  if (!user) return null;

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin", admin: "Admin", manager: "Manager",
    team_lead: "Team Lead", member: "Member", viewer: "Viewer",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Avatar name={user.name} src={user.avatarUrl} size="xl" role={user.role} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <Badge variant={user.status === "active" ? "success" : user.status === "suspended" ? "destructive" : "default"}>
                {user.status}
              </Badge>
              {user.lockedUntil && new Date(user.lockedUntil) > new Date() && <Badge variant="warning">Account Locked</Badge>}
            </div>
            <p className="text-muted-foreground mt-1">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {user.userRoles.map((ur) => (
                <Badge key={ur.role.id} variant="secondary">{roleLabels[ur.role.name] || ur.role.name}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FolderKanban className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{user._count.projects}</p><p className="text-xs text-muted-foreground">Projects</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><CheckSquare className="h-5 w-5 text-blue-500" /></div>
            <div><p className="text-2xl font-bold">{user._count.assignedTasks}</p><p className="text-xs text-muted-foreground">Tasks Assigned</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><Activity className="h-5 w-5 text-emerald-500" /></div>
            <div><p className="text-2xl font-bold">{user._count.activities}</p><p className="text-xs text-muted-foreground">Activities</p></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">Email Verified</p><p className="font-medium">{user.emailVerified ? "Yes" : "No"}</p></div>
            <div><p className="text-sm text-muted-foreground">Last Login</p><p className="font-medium">{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}</p></div>
            <div><p className="text-sm text-muted-foreground">Login Attempts</p><p className="font-medium">{user.loginAttempts}</p></div>
            <div><p className="text-sm text-muted-foreground">Force Password Reset</p><p className="font-medium">{user.forcePasswordReset ? "Yes" : "No"}</p></div>
            <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{formatRelativeTime(user.createdAt)}</p></div>
            <div><p className="text-sm text-muted-foreground">Last Updated</p><p className="font-medium">{formatRelativeTime(user.updatedAt)}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
