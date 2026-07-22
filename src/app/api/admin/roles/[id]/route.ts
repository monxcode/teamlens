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

    const allowed = await hasPermission(payload.userId, "roles:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const before = await db.role.findUnique({ where: { id }, select: { name: true, description: true } });

    const role = await db.role.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "role.updated",
      resource: "role",
      resourceId: id,
      before,
      after: { name: role.name, description: role.description },
      ipAddress, userAgent, device,
    });

    return Response.json({ role });
  } catch (error) {
    console.error("Admin role update error:", error);
    return Response.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "roles:delete");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const role = await db.role.findUnique({ where: { id } });
    if (!role) return Response.json({ error: "Role not found" }, { status: 404 });
    if (role.isSystem) return Response.json({ error: "Cannot delete system roles" }, { status: 400 });

    await db.role.delete({ where: { id } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "role.deleted",
      resource: "role",
      resourceId: id,
      before: { name: role.name },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin role delete error:", error);
    return Response.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
