import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:settings");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const settings = await db.systemSetting.findMany({ orderBy: { category: "asc" } });
    const grouped = settings.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {} as Record<string, typeof settings>);

    return Response.json({ settings, grouped });
  } catch (error) {
    console.error("Admin settings fetch error:", error);
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
