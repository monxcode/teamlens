"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Shield, FolderKanban, CheckSquare,
  Building2, Users2, BarChart3, Activity, ScrollText, Settings,
  Server, Flag, History, Megaphone, Zap, ChevronLeft, X, Menu,
  LogOut, Bell, Sun, Moon, Link2, MessageSquare,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { Avatar } from "@/components/ui/avatar";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: Shield },
  { href: "/admin/permissions", label: "Permissions", icon: Shield },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/admin/teams", label: "Teams", icon: Users2 },
  { href: "/admin/teams/chat", label: "Team Chats", icon: MessageSquare },
  { href: "/admin/assignments", label: "Assignments", icon: Link2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/login-history", label: "Login History", icon: History },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/health", label: "System Health", icon: Server },
];

function AdminSidebar({ isOpen, toggle, mobileOpen, setMobileOpen }: {
  isOpen: boolean; toggle: () => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full border-r bg-card transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-[68px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <Zap className="h-4.5 w-4.5 text-red-500" />
            </div>
            {isOpen && <span className="text-lg font-bold tracking-tight">Admin</span>}
          </Link>
          <button onClick={toggle} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors">
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} title={!isOpen ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive ? "bg-red-500/10 text-red-500" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <Link href="/dashboard" className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <Activity className="h-4.5 w-4.5 shrink-0" />
            {isOpen && <span>Back to App</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}

function AdminHeader({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-medium text-muted-foreground">Administration</h1>
          <p className="text-lg font-semibold">{user?.name || "Admin"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted relative">
          <Bell className="h-4.5 w-4.5" />
        </button>
        <button onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted text-destructive">
          <LogOut className="h-4.5 w-4.5" />
        </button>
        <Avatar name={user?.name || "A"} src={user?.avatarUrl} size="sm" role={user?.role} />
      </div>
    </header>
  );
}

function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has admin role and password status
    const token = localStorage.getItem("pulse_token");
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const u = data.user;
        if (!u) {
          router.push("/login");
        } else if (u.forcePasswordReset) {
          router.push("/change-password");
        } else if (u.role === "super_admin" || u.role === "admin") {
          setIsAdmin(true);
        } else {
          router.push("/dashboard");
        }
        setChecking(false);
      })
      .catch(() => {
        router.push("/login");
        setChecking(false);
      });
  }, [user, isLoading, router]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminAuthCheck>
          <div className="min-h-screen">
            <AdminSidebar
              isOpen={sidebarOpen}
              toggle={() => setSidebarOpen(!sidebarOpen)}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
            />
            <div className={cn(
              "transition-all duration-300 min-h-screen flex flex-col",
              sidebarOpen ? "lg:ml-64" : "lg:ml-[68px]"
            )}>
              <AdminHeader mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
              <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
          </div>
        </AdminAuthCheck>
      </AuthProvider>
    </ThemeProvider>
  );
}
