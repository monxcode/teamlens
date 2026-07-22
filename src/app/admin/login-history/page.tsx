"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { History } from "lucide-react";

interface LoginEntry {
  id: string; email: string; success: boolean; ipAddress: string | null;
  userAgent: string | null; device: string | null; reason: string | null;
  createdAt: string;
}

export default function AdminLoginHistoryPage() {
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchHistory(); }, [page]);

  async function fetchHistory() {
    setLoading(true);
    const res = await fetch(`/api/admin/login-history?page=${page}&limit=50`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setHistory(data.history || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Login History</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} total login attempts</p>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : history.length === 0 ? (
        <EmptyState icon={<History className="h-8 w-8" />} title="No login history" description="Login attempts will appear here." />
      ) : (
        <Card className="divide-y">
          {history.map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 p-4">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${entry.success ? "bg-emerald-500" : "bg-destructive"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{entry.email}</span>
                  <Badge variant={entry.success ? "success" : "destructive"}>{entry.success ? "Success" : "Failed"}</Badge>
                  {entry.device && <Badge variant="secondary">{entry.device}</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>IP: {entry.ipAddress || "Unknown"}</span>
                  {entry.reason && <span>Reason: {entry.reason}</span>}
                  <span>{formatRelativeTime(entry.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </Card>
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
