"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  MessageSquare,
  Settings,
  Zap,
  ChevronLeft,
  X,
  Megaphone,
} from "lucide-react";

const allNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/team/chat", label: "Team Chat", icon: MessageSquare },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone, showBadge: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();
  const { token } = useAuthStore();
  const [hasTeam, setHasTeam] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/teams", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setHasTeam(!!data.myTeam))
      .catch(() => setHasTeam(false));

    fetch("/api/announcements", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setUnreadAnnouncements(data.unreadCount || 0))
      .catch(() => {});
  }, [token]);

  const navItems = allNavItems.filter(
    (item) => item.href !== "/dashboard/team/chat" || hasTeam
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full border-r bg-card transition-all duration-300 flex flex-col",
          isOpen ? "w-64" : "w-[68px]",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4.5 w-4.5 text-primary" />
            </div>
            {isOpen && (
              <span className="text-lg font-bold tracking-tight">Pulse</span>
            )}
          </Link>
          <button
            onClick={toggle}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                !isOpen && "rotate-180"
              )}
            />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={!isOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {isOpen && <span className="flex-1">{item.label}</span>}
                {item.showBadge && unreadAnnouncements > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {unreadAnnouncements > 99 ? "99+" : unreadAnnouncements}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          {isOpen ? (
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 p-4">
              <p className="text-xs font-medium text-foreground">
                Upgrade to Pro
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Get AI-powered insights
              </p>
              <button className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Upgrade
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
