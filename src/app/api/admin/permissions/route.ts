import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "roles:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const permissions = await db.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    // Group by module
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return Response.json({ permissions, grouped });
  } catch (error) {
    console.error("Admin permissions fetch error:", error);
    return Response.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
