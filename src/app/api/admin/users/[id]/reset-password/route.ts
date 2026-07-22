import { db } from "@/lib/db";
import { getUserFromRequest, hashPassword } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getClientInfo } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = await hasPermission(payload.userId, "users:reset_password");
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { newPassword, forceReset } = body;

    if (!newPassword || newPassword.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null,
        forcePasswordReset: forceReset || false,
      },
    });

    const { ipAddress, userAgent, device } = getClientInfo(request);
    await createAuditLog({
      adminId: payload.userId,
      action: "user.password_reset",
      resource: "user",
      resourceId: id,
      after: { forcePasswordReset: forceReset || false },
      ipAddress, userAgent, device,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return Response.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
