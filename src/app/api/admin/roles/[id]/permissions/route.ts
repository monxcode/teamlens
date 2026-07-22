import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";
import { clearPermissionCache } from "@/lib/rbac";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "roles:assign");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return Response.json({ error: "permissionIds must be an array" }, { status: 400 });
    }

    const role = await db.role.findUnique({ where: { id } });
    if (!role) return Response.json({ error: "Role not found" }, { status: 404 });

    const before = await db.rolePermission.findMany({
      where: { roleId: id },
      select: { permissionId: true },
    });

    // Remove all existing permissions
    await db.rolePermission.deleteMany({ where: { roleId: id } });

    // Add new permissions
    for (const permId of permissionIds) {
      await db.rolePermission.create({ data: { roleId: id, permissionId: permId } });
    }

    // Clear permission cache for all users with this role
    const usersWithRole = await db.userRole.findMany({ where: { roleId: id } });
    for (const ur of usersWithRole) {
      clearPermissionCache(ur.userId);
    }

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "role.permissions_updated",
      resource: "role",
      resourceId: id,
      before: { permissionCount: before.length },
      after: { permissionCount: permissionIds.length },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin role permissions error:", error);
    return Response.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
