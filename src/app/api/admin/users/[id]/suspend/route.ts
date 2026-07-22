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

    const body = await request.json();
    const { suspend } = body; // true = suspend, false = activate

    const permission = suspend ? "users:suspend" : "users:activate";
    const allowed = await hasPermission(payload.userId, permission);
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    if (id === payload.userId) {
      return Response.json({ error: "Cannot suspend your own account" }, { status: 400 });
    }

    const before = await db.user.findUnique({
      where: { id },
      select: { status: true, name: true, email: true },
    });

    const newStatus = suspend ? "suspended" : "active";
    const user = await db.user.update({
      where: { id },
      data: {
        status: newStatus,
        ...(suspend && { lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
        ...(!suspend && { lockedUntil: null, loginAttempts: 0 }),
      },
      select: { id: true, name: true, email: true, status: true },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: suspend ? "user.suspended" : "user.activated",
      resource: "user",
      resourceId: id,
      before: { status: before?.status },
      after: { status: newStatus },
      ipAddress, userAgent, device,
    });

    return Response.json({ user });
  } catch (error) {
    console.error("Admin user suspend error:", error);
    return Response.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
