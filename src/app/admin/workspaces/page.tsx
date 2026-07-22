"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Users, FolderKanban } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Workspace {
  id: string; name: string; slug: string; status: string; createdAt: string;
  members: { id: string; role: string; userId: string }[];
  _count: { projects: number };
}

export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/workspaces", { headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` } })
      .then((r) => r.json())
      .then((d) => { setWorkspaces(d.workspaces || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
        <p className="mt-1 text-sm text-muted-foreground">{workspaces.length} total workspaces</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : workspaces.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="No workspaces" description="Workspaces are created when users register." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Card key={ws.id} hover className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{ws.name}</h3>
                  <p className="text-xs text-muted-foreground">/{ws.slug}</p>
                </div>
                <Badge variant={ws.status === "active" ? "success" : "secondary"}>{ws.status}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {ws.members.length} members</span>
                <span className="flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> {ws._count.projects} projects</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Created {formatRelativeTime(ws.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
