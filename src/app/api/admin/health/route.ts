import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:health");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const [userCount, projectCount, taskCount, workspaceCount, sessionCount] = await Promise.all([
      db.user.count(),
      db.project.count(),
      db.task.count(),
      db.workspace.count(),
      db.session.count(),
    ]);

    const dbSize = "N/A"; // SQLite doesn't easily expose this

    return Response.json({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        size: dbSize,
      },
      counts: {
        users: userCount,
        projects: projectCount,
        tasks: taskCount,
        workspaces: workspaceCount,
        activeSessions: sessionCount,
      },
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
    });
  } catch (error) {
    console.error("Admin health error:", error);
    return Response.json({ status: "unhealthy", error: "Database connection failed" }, { status: 500 });
  }
}
