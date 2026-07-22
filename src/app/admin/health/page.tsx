"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Users, FolderKanban, CheckSquare, Building2, Activity } from "lucide-react";

interface HealthData {
  status: string; uptime: number; timestamp: string;
  database: { status: string; size: string };
  counts: { users: number; projects: number; tasks: number; workspaces: number; activeSessions: number };
  environment: string; nodeVersion: string;
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/health", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } })
      .then((r) => r.json())
      .then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;
  if (!health) return null;

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor system status and resource usage</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${health.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
          <div>
            <h2 className="text-lg font-bold capitalize">{health.status}</h2>
            <p className="text-sm text-muted-foreground">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><Server className="h-5 w-5 text-blue-500" /></div>
            <div><p className="text-2xl font-bold">{formatUptime(health.uptime)}</p><p className="text-xs text-muted-foreground">Uptime</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10"><Database className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-lg font-bold capitalize">{health.database.status}</p>
              <p className="text-xs text-muted-foreground">Database</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10"><Activity className="h-5 w-5 text-purple-500" /></div>
            <div><p className="text-2xl font-bold">{health.counts.activeSessions}</p><p className="text-xs text-muted-foreground">Active Sessions</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10"><Server className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-lg font-bold">{health.nodeVersion}</p><p className="text-xs text-muted-foreground">Node.js</p></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Database Statistics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Users, label: "Users", value: health.counts.users, color: "blue" },
              { icon: FolderKanban, label: "Projects", value: health.counts.projects, color: "indigo" },
              { icon: CheckSquare, label: "Tasks", value: health.counts.tasks, color: "emerald" },
              { icon: Building2, label: "Workspaces", value: health.counts.workspaces, color: "purple" },
              { icon: Activity, label: "Sessions", value: health.counts.activeSessions, color: "amber" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 rounded-lg bg-muted/50">
                <item.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Environment</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Environment</span>
              <Badge variant={health.environment === "production" ? "destructive" : "default"}>{health.environment}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Node.js Version</span>
              <span className="text-sm font-mono">{health.nodeVersion}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Database Status</span>
              <Badge variant="success">{health.database.status}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">System Status</span>
              <Badge variant={health.status === "healthy" ? "success" : "destructive"}>{health.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
