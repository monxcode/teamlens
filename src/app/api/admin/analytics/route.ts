import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "analytics:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProjects,
      activeProjects,
      archivedProjects,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      totalWorkspaces,
      totalActivities,
      recentLogins,
      failedLogins,
      usersByRole,
      newUsersThisWeek,
      newUsersThisMonth,
      tasksCreatedThisWeek,
      tasksCompletedThisWeek,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "active" } }),
      db.user.count({ where: { status: "suspended" } }),
      db.project.count(),
      db.project.count({ where: { status: "active" } }),
      db.project.count({ where: { status: "archived" } }),
      db.task.count(),
      db.task.groupBy({ by: ["status"], _count: true }),
      db.task.groupBy({ by: ["priority"], _count: true }),
      db.workspace.count(),
      db.activity.count(),
      db.loginHistory.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.loginHistory.count({ where: { success: false, createdAt: { gte: sevenDaysAgo } } }),
      db.user.groupBy({ by: ["role"], _count: true }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.task.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.task.count({ where: { status: "done", updatedAt: { gte: sevenDaysAgo } } }),
    ]);

    const completionRate = totalTasks > 0
      ? Math.round((tasksByStatus.find((s) => s.status === "done")?._count || 0) / totalTasks * 100)
      : 0;

    return Response.json({
      overview: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalProjects,
        activeProjects,
        archivedProjects,
        totalTasks,
        totalWorkspaces,
        totalActivities,
        completionRate,
      },
      tasks: { byStatus: tasksByStatus, byPriority: tasksByPriority },
      users: { byRole: usersByRole, newThisWeek: newUsersThisWeek, newThisMonth: newUsersThisMonth },
      tasksThisWeek: { created: tasksCreatedThisWeek, completed: tasksCompletedThisWeek },
      security: { recentLogins, failedLogins },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return Response.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
