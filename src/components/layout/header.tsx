"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { connectSocket } from "@/lib/socket-client";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { formatRelativeTime } from "@/lib/utils";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Trash2,
} from "lucide-react";

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { setMobileOpen } = useSidebarStore();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; read: boolean; createdAt: string }[]
  >([]);
  const [announcements, setAnnouncements] = useState<
    { id: string; title: string; message: string; type: string; createdAt: string; isRead: boolean }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("pulse_token");
    if (!token) return;
    const socket = connectSocket(token);
    function handleDeleted(data: { announcementId: string }) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== data.announcementId));
      setUnreadAnnouncements((prev) => Math.max(0, prev - 1));
    }
    socket.on("announcement:deleted", handleDeleted);
    return () => { socket.off("announcement:deleted", handleDeleted); };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const token = sessionStorage.getItem("pulse_token");
      const [notifRes, announceRes] = await Promise.all([
        fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/announcements", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
      if (announceRes.ok) {
        const data = await announceRes.json();
        setAnnouncements(data.announcements?.slice(0, 5) || []);
        setUnreadAnnouncements(data.unreadCount || 0);
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      const token = sessionStorage.getItem("pulse_token");
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function clearAll() {
    try {
      const token = sessionStorage.getItem("pulse_token");
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setShowClearConfirm(false);
        setShowNotifications(false);
      }
    } catch {}
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-medium text-muted-foreground">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
          </h1>
          <p className="text-lg font-semibold">{user?.name || "Welcome"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors relative"
          >
            <Bell className="h-4.5 w-4.5" />
            {(unreadCount + unreadAnnouncements) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount + unreadAnnouncements}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="font-semibold text-sm">Notifications</p>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && announcements.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  <>
                    {announcements.length > 0 && (
                      <div>
                        <p className="px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b">
                          Announcements
                        </p>
                        {announcements.map((a) => (
                          <div
                            key={a.id}
                            className={`border-b px-4 py-3 last:border-0 ${!a.isRead ? "bg-amber-500/5" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{a.title}</p>
                              {!a.isRead && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(a.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {notifications.length > 0 && (
                      <div>
                        {announcements.length > 0 && (
                          <p className="px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b">
                            Notifications
                          </p>
                        )}
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`border-b px-4 py-3 last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
                          >
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
          >
            <Avatar name={user?.name || "U"} src={user?.avatarUrl} size="sm" role={user?.role} />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card shadow-xl overflow-hidden">
              <div className="border-b px-4 py-3">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    router.push("/dashboard/settings");
                    setShowProfile(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear all notifications"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to clear all notifications? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={clearAll}
              className="flex-1"
            >
              Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
