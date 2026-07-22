"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { Activity } from "lucide-react";

interface ActivityItem {
  id: string; type: string; details: string | null; createdAt: string;
  user: { id: string; name: string; email: string };
  task: { id: string; title: string } | null;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchActivities(); }, [page]);

  async function fetchActivities() {
    setLoading(true);
    const res = await fetch(`/api/admin/activity?page=${page}&limit=50`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setActivities(data.activities || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">All user activities across the system</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : activities.length === 0 ? (
        <EmptyState icon={<Activity className="h-8 w-8" />} title="No activity" description="Activity will appear here as users interact with the system." />
      ) : (
        <Card className="divide-y">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{a.user.name}</span>{" "}
                  <span className="text-muted-foreground">{a.details}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
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
