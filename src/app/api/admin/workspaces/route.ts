import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "workspaces:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [workspaces, total] = await Promise.all([
      db.workspace.findMany({
        include: {
          members: { select: { id: true, role: true, userId: true } },
          _count: { select: { projects: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.workspace.count(),
    ]);

    return Response.json({ workspaces, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin workspaces fetch error:", error);
    return Response.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
}
