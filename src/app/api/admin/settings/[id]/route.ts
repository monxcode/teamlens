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

    const allowed = await hasPermission(payload.userId, "system:settings");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const before = await db.systemSetting.findUnique({ where: { id } });

    const setting = await db.systemSetting.update({
      where: { id },
      data: { value: body.value },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "setting.updated",
      resource: "setting",
      resourceId: id,
      before: { key: before?.key, value: before?.value },
      after: { key: setting.key, value: setting.value },
      ipAddress, userAgent, device,
    });

    return Response.json({ setting });
  } catch (error) {
    console.error("Admin settings update error:", error);
    return Response.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
