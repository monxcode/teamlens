"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { ScrollText, Search, ChevronDown, ChevronUp } from "lucide-react";

interface AuditLog {
  id: string; action: string; resource: string; resourceId: string | null;
  before: string | null; after: string | null; ipAddress: string | null;
  userAgent: string | null; device: string | null; createdAt: string;
  admin: { id: string; name: string; email: string };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState("all");
  const [filterResource, setFilterResource] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchLogs(); }, [page, filterAction, filterResource]);

  async function fetchLogs() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (filterAction !== "all") params.set("action", filterAction);
    if (filterResource !== "all") params.set("resource", filterResource);
    const res = await fetch(`/api/admin/audit?${params}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setLogs(data.logs || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }

  const actionColors: Record<string, string> = {
    user: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    role: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    project: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    setting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    feature_flag: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    announcement: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} total entries</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Actions" }, { value: "user", label: "User Actions" }, { value: "role", label: "Role Actions" }, { value: "project", label: "Project Actions" }, { value: "task", label: "Task Actions" }, { value: "setting", label: "Settings" }, { value: "feature_flag", label: "Feature Flags" }]} />
        <Select value={filterResource} onChange={(e) => { setFilterResource(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Resources" }, { value: "user", label: "User" }, { value: "role", label: "Role" }, { value: "project", label: "Project" }, { value: "task", label: "Task" }, { value: "setting", label: "Setting" }, { value: "feature_flag", label: "Feature Flag" }, { value: "announcement", label: "Announcement" }]} />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-8 w-8" />} title="No audit logs" description="Admin actions will be logged here." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors">
                <Badge className={actionColors[log.resource] || "bg-gray-100 text-gray-700"}>{log.resource}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">by {log.admin.name}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(log.createdAt)}</span>
                {expandedId === log.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {expandedId === log.id && (
                <div className="border-t p-4 bg-muted/30 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><p className="text-xs text-muted-foreground">Admin</p><p className="text-sm">{log.admin.name} ({log.admin.email})</p></div>
                    <div><p className="text-xs text-muted-foreground">Resource ID</p><p className="text-sm font-mono text-xs">{log.resourceId || "N/A"}</p></div>
                    <div><p className="text-xs text-muted-foreground">IP Address</p><p className="text-sm">{log.ipAddress || "Unknown"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Device</p><p className="text-sm">{log.device || "Unknown"}</p></div>
                  </div>
                  {log.before && (
                    <div><p className="text-xs text-muted-foreground mb-1">Before</p>
                      <pre className="text-xs bg-card p-2 rounded-lg overflow-x-auto">{JSON.stringify(JSON.parse(log.before), null, 2)}</pre>
                    </div>
                  )}
                  {log.after && (
                    <div><p className="text-xs text-muted-foreground mb-1">After</p>
                      <pre className="text-xs bg-card p-2 rounded-lg overflow-x-auto">{JSON.stringify(JSON.parse(log.after), null, 2)}</pre>
                    </div>
                  )}
                  {log.userAgent && <div><p className="text-xs text-muted-foreground">User Agent</p><p className="text-xs break-all">{log.userAgent}</p></div>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
