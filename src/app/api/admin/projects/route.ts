import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "projects:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search };
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
          workspace: { select: { id: true, name: true } },
          tasks: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.project.count({ where }),
    ]);

    const enriched = projects.map((p) => ({
      ...p,
      taskCount: p.tasks.length,
      completedCount: p.tasks.filter((t) => t.status === "done").length,
    }));

    return Response.json({ projects: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin projects fetch error:", error);
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
