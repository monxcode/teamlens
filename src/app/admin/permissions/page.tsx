"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface Permission { id: string; name: string; module: string; action: string; description: string | null; }

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/permissions", { headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` } })
      .then((r) => r.json())
      .then((d) => { setPermissions(d.permissions || []); setLoading(false); });
  }, []);

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const actionColors: Record<string, string> = {
    view: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    edit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">{permissions.length} permissions across {Object.keys(grouped).length} modules</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {Object.entries(grouped).map(([module, perms]) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="text-base capitalize flex items-center gap-2">
                  <Shield className="h-4 w-4" /> {module}
                  <Badge variant="secondary">{perms.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {perms.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">{p.action}</span>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </div>
                      <Badge className={actionColors[p.action] || ""}>{p.action}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
