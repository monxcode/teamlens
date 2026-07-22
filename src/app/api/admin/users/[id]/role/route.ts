import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";
import { clearPermissionCache } from "@/lib/rbac";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "users:change_role");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) return Response.json({ error: "Role ID is required" }, { status: 400 });

    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) return Response.json({ error: "Role not found" }, { status: 404 });

    const before = await db.user.findUnique({
      where: { id },
      select: { role: true },
    });

    // Remove existing roles
    await db.userRole.deleteMany({ where: { userId: id } });

    // Assign new role
    await db.userRole.create({ data: { userId: id, roleId } });

    // Update user's primary role
    await db.user.update({
      where: { id },
      data: { role: role.name },
    });

    clearPermissionCache(id);

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "user.role_changed",
      resource: "user",
      resourceId: id,
      before: { role: before?.role },
      after: { role: role.name, roleId },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true, role: role.name });
  } catch (error) {
    console.error("Admin user role error:", error);
    return Response.json({ error: "Failed to change role" }, { status: 500 });
  }
}
