import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "users:view");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        avatar: true, avatarUrl: true, emailVerified: true, lastLoginAt: true,
        loginAttempts: true, lockedUntil: true, forcePasswordReset: true,
        createdAt: true, updatedAt: true,
        userRoles: { include: { role: true } },
        _count: { select: { assignedTasks: true, projects: true, activities: true } },
      },
    });

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    return Response.json({ user });
  } catch (error) {
    console.error("Admin user fetch error:", error);
    return Response.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "users:edit");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const before = await db.user.findUnique({ where: { id }, select: { name: true, email: true, role: true, status: true } });

    const user = await db.user.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.email && { email: body.email }),
        ...(body.role && { role: body.role }),
        ...(body.status && { status: body.status }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "user.updated",
      resource: "user",
      resourceId: id,
      before,
      after: user,
      ipAddress, userAgent, device,
    });

    return Response.json({ user });
  } catch (error) {
    console.error("Admin user update error:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "users:delete");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Prevent deleting yourself
    if (id === payload.userId) {
      return Response.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id }, select: { name: true, email: true, role: true } });
    await db.user.delete({ where: { id } });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "user.deleted",
      resource: "user",
      resourceId: id,
      before: user,
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
