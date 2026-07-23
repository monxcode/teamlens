"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import { Megaphone, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { connectSocket, getSocket } from "@/lib/socket-client";

interface Announcement {
  id: string; title: string; message: string; type: string;
  createdAt: string; author: { id: string; name: string; avatarUrl: string | null; role: string };
  isRead: boolean; readAt: string | null;
}

export default function AnnouncementsPage() {
  const { token } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    if (!token) return;
    const socket = connectSocket(token);
    function handleNew(a: Announcement) {
      setAnnouncements((prev) => [a, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }
    function handleDeleted(data: { announcementId: string }) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== data.announcementId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    socket.on("announcement:new", handleNew);
    socket.on("announcement:deleted", handleDeleted);
    return () => { socket.off("announcement:new", handleNew); socket.off("announcement:deleted", handleDeleted); };
  }, [token]);

  async function fetchAnnouncements() {
    try {
      const res = await fetch("/api/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
    setLoading(false);
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/announcements/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true, readAt: new Date().toISOString() } : a));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch("/api/announcements/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  }

  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : announcements.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-8 w-8" />} title="No announcements" description="There are no announcements at this time." />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className={`transition-colors ${!a.isRead ? "border-primary/30 bg-primary/[0.02]" : ""}`}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={a.author.name} src={a.author.avatarUrl} size="sm" role={a.author.role} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <Badge className={typeColors[a.type] || typeColors.info}>{a.type}</Badge>
                      {!a.isRead && <Badge variant="default" className="text-[10px]">New</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{a.message}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">By {a.author.name}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
                      {!a.isRead && (
                        <button onClick={() => markAsRead(a.id)} className="text-xs text-primary hover:underline ml-auto">
                          Mark as read
                        </button>
                      )}
                      {a.isRead && a.readAt && (
                        <span className="text-xs text-muted-foreground ml-auto">Read {formatRelativeTime(a.readAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
