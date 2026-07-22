import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:feature_flags");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const before = await db.featureFlag.findUnique({ where: { id } });

    const flag = await db.featureFlag.update({
      where: { id },
      data: {
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "feature_flag.updated",
      resource: "feature_flag",
      resourceId: id,
      before: { enabled: before?.enabled },
      after: { enabled: flag.enabled },
      ipAddress, userAgent, device,
    });

    return Response.json({ flag });
  } catch (error) {
    console.error("Admin feature flag update error:", error);
    return Response.json({ error: "Failed to update feature flag" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "system:feature_flags");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const flag = await db.featureFlag.findUnique({ where: { id } });
    await db.featureFlag.delete({ where: { id } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "feature_flag.deleted",
      resource: "feature_flag",
      resourceId: id,
      before: { name: flag?.name },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin feature flag delete error:", error);
    return Response.json({ error: "Failed to delete feature flag" }, { status: 500 });
  }
}
