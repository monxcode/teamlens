"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { X, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

export function AnnouncementBanner() {
  const { token } = useAuthStore();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Check if user has already seen this banner this session
    const lastSeen = sessionStorage.getItem("announcement_banner_seen");
    if (lastSeen) return;

    fetch("/api/announcements", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const unread = (data.announcements || []).find((a: Announcement & { isRead: boolean }) => !a.isRead);
        if (unread) {
          setAnnouncement(unread);
        }
      })
      .catch(() => {});
  }, [token]);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("announcement_banner_seen", "true");
    // Mark as read
    if (announcement && token) {
      fetch(`/api/announcements/${announcement.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  if (!announcement || dismissed) return null;

  const typeStyles: Record<string, string> = {
    info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50",
    warning: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50",
    critical: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50",
  };

  return (
    <div className={`rounded-xl border p-4 ${typeStyles[announcement.type] || typeStyles.info}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Megaphone className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{announcement.title}</p>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{announcement.message}</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={dismiss}>Dismiss</Button>
      </div>
    </div>
  );
}
