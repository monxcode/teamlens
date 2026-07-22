import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "roles:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const roles = await db.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ roles });
  } catch (error) {
    console.error("Admin roles fetch error:", error);
    return Response.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "roles:create");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

    const existing = await db.role.findUnique({ where: { name } });
    if (existing) return Response.json({ error: "Role name already exists" }, { status: 409 });

    const role = await db.role.create({
      data: { name, description },
    });

    if (permissionIds && Array.isArray(permissionIds)) {
      for (const permId of permissionIds) {
        await db.rolePermission.create({ data: { roleId: role.id, permissionId: permId } });
      }
    }

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "role.created",
      resource: "role",
      resourceId: role.id,
      after: { name, description, permissionCount: permissionIds?.length || 0 },
      ipAddress, userAgent, device,
    });

    return Response.json({ role });
  } catch (error) {
    console.error("Admin role create error:", error);
    return Response.json({ error: "Failed to create role" }, { status: 500 });
  }
}
