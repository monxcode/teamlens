import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:feature_flags");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const flags = await db.featureFlag.findMany({ orderBy: { createdAt: "asc" } });
    return Response.json({ flags });
  } catch (error) {
    console.error("Admin feature flags fetch error:", error);
    return Response.json({ error: "Failed to fetch feature flags" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:feature_flags");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, description, enabled } = body;

    if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

    const flag = await db.featureFlag.create({
      data: { name, description, enabled: enabled || false },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "feature_flag.created",
      resource: "feature_flag",
      resourceId: flag.id,
      after: { name, enabled: flag.enabled },
      ipAddress, userAgent, device,
    });

    return Response.json({ flag });
  } catch (error) {
    console.error("Admin feature flag create error:", error);
    return Response.json({ error: "Failed to create feature flag" }, { status: 500 });
  }
}
